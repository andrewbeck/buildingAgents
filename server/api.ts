import express, { Router, type Request, type Response, type NextFunction } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { buildTree, classifyFile, ALLOWED_EXTENSIONS } from "./tree.ts";
import { resolveSafe, UnsafePathError } from "./safePath.ts";
import { Store } from "./notes.ts";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_NOTE_BYTES = 256 * 1024; // 256 KB
const MAX_SAVE_BYTES = 2 * 1024 * 1024; // 2 MB — content size cap for PUT /file

interface Deps {
  contentRoot: string;
  store: Store;
}

const noteSchema = z.object({
  path: z.string().min(1).max(4096),
  body: z.string().max(MAX_NOTE_BYTES),
  anchors: z.record(z.string().min(1).max(256), z.string().max(MAX_NOTE_BYTES)).optional(),
});

const progressSchema = z.object({
  path: z.string().min(1).max(4096),
  read: z.boolean(),
});

const saveFileSchema = z.object({
  path: z.string().min(1).max(4096),
  content: z.string().max(MAX_SAVE_BYTES),
});

export function createApi(deps: Deps): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, contentRoot: deps.contentRoot });
  });

  router.get("/tree", async (_req, res, next) => {
    try {
      const tree = await buildTree(deps.contentRoot);
      res.json({ root: deps.contentRoot, nodes: tree });
    } catch (err) {
      next(err);
    }
  });

  router.get("/file", async (req, res, next) => {
    try {
      const rel = String(req.query.path ?? "");
      const safeAbs = await resolveSafe(deps.contentRoot, rel);
      const stat = await fs.stat(safeAbs);
      if (!stat.isFile()) {
        return res.status(400).json({ error: "not a file" });
      }
      if (stat.size > MAX_FILE_BYTES) {
        return res.status(413).json({ error: "file too large" });
      }
      const ext = path.extname(safeAbs).toLowerCase();
      if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({ error: "extension not allowed" });
      }
      const content = await fs.readFile(safeAbs, "utf8");
      const name = path.basename(safeAbs);
      res.json({
        path: rel,
        name,
        ext,
        size: stat.size,
        kind: classifyFile(name, ext),
        content,
      });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    "/file",
    express.json({ limit: `${MAX_SAVE_BYTES + 64 * 1024}b` }),
    async (req, res, next) => {
      try {
        const parsed = saveFileSchema.parse(req.body);
        const safeAbs = await resolveSafe(deps.contentRoot, parsed.path);
        const stat = await fs.stat(safeAbs);
        if (!stat.isFile()) {
          return res.status(400).json({ error: "not a file" });
        }
        const ext = path.extname(safeAbs).toLowerCase();
        if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
          return res.status(400).json({ error: "extension not allowed" });
        }
        await fs.writeFile(safeAbs, parsed.content, "utf8");
        const newStat = await fs.stat(safeAbs);
        const name = path.basename(safeAbs);
        res.json({
          path: parsed.path,
          name,
          ext,
          size: newStat.size,
          kind: classifyFile(name, ext),
          content: parsed.content,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/notes", async (_req, res, next) => {
    try {
      const notes = await deps.store.getNotes();
      res.json({ notes });
    } catch (err) {
      next(err);
    }
  });

  router.put("/notes", async (req, res, next) => {
    try {
      const parsed = noteSchema.parse(req.body);
      // Validate the path resolves under root, but don't require the file to
      // currently exist (you might have notes about a file that just moved).
      try {
        await resolveSafe(deps.contentRoot, parsed.path);
      } catch (err) {
        if (err instanceof UnsafePathError && err.message !== "file not found") throw err;
        // Allow note for a missing file as long as the relative shape is valid.
      }
      const entry = await deps.store.setNote(parsed.path, {
        body: parsed.body,
        anchors: parsed.anchors ?? {},
      });
      res.json({ path: parsed.path, entry });
    } catch (err) {
      next(err);
    }
  });

  router.get("/progress", async (_req, res, next) => {
    try {
      const progress = await deps.store.getProgress();
      res.json({ progress });
    } catch (err) {
      next(err);
    }
  });

  router.put("/progress", async (req, res, next) => {
    try {
      const parsed = progressSchema.parse(req.body);
      const entry = await deps.store.setProgress(parsed.path, parsed.read);
      res.json({ path: parsed.path, entry });
    } catch (err) {
      next(err);
    }
  });

  // Error handler for this router.
  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof UnsafePathError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "invalid body", issues: err.issues });
    }
    const message = err instanceof Error ? err.message : "internal error";
    console.error("[api] error:", message);
    res.status(500).json({ error: "internal error" });
  });

  return router;
}
