import express from "express";
import helmet from "helmet";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import fs from "node:fs/promises";
import { createApi } from "./api.ts";
import { Store } from "./notes.ts";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function expandHome(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

const PORT = Number(process.env.PORT ?? 3001);
const HOST = "127.0.0.1";
const CONTENT_ROOT = path.resolve(
  expandHome(process.env.CONTENT_ROOT ?? path.join(repoRoot, "content")),
);
const DATA_DIR = path.join(repoRoot, ".data");
const NOTES_PATH = path.join(DATA_DIR, "notes.json");
const PROGRESS_PATH = path.join(DATA_DIR, "progress.json");
const IS_PROD = process.env.NODE_ENV === "production";

async function main() {
  // Verify content root exists and is a directory.
  try {
    const stat = await fs.stat(CONTENT_ROOT);
    if (!stat.isDirectory()) {
      throw new Error(`CONTENT_ROOT is not a directory: ${CONTENT_ROOT}`);
    }
  } catch (err) {
    console.error(
      `[server] content root unreachable at ${CONTENT_ROOT}. Set CONTENT_ROOT env var to override.`,
    );
    throw err;
  }

  const store = new Store({ notesPath: NOTES_PATH, progressPath: PROGRESS_PATH });
  await store.init();

  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", false);

  app.use(
    helmet({
      contentSecurityPolicy: IS_PROD
        ? {
            useDefaults: true,
            directives: {
              "default-src": ["'self'"],
              "script-src": ["'self'"],
              // react-markdown / katex / mermaid require inline styles at runtime.
              "style-src": ["'self'", "'unsafe-inline'"],
              "img-src": ["'self'", "data:"],
              "font-src": ["'self'", "data:"],
              "connect-src": ["'self'"],
              "object-src": ["'none'"],
              "frame-ancestors": ["'none'"],
              "base-uri": ["'self'"],
            },
          }
        : false, // CSP off in dev; Vite injects inline scripts.
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
    }),
  );

  app.use(express.json({ limit: "512kb" }));

  app.use("/api", createApi({ contentRoot: CONTENT_ROOT, store }));

  if (IS_PROD) {
    const distDir = path.join(repoRoot, "dist");
    app.use(express.static(distDir, { index: false, maxAge: "1h" }));
    app.get("*", async (_req, res, next) => {
      try {
        const html = await fs.readFile(path.join(distDir, "index.html"), "utf8");
        res.type("html").send(html);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[server] listening on http://${HOST}:${PORT}`);
    console.log(`[server] content root: ${CONTENT_ROOT}`);
    if (!IS_PROD) {
      console.log(`[server] dev: open http://127.0.0.1:5173 (Vite proxies /api here)`);
    }
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
