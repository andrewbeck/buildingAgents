import fs from "node:fs/promises";
import path from "node:path";

export const ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".yaml",
  ".yml",
  ".py",
  ".mmd",
  ".json",
  ".toml",
  ".sh",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

const MAX_EXTENSIONLESS_SIZE = 5 * 1024 * 1024; // 5 MB

export type FileKind = "markdown" | "mermaid" | "code" | "text";

export interface FileNode {
  type: "file";
  name: string;
  path: string; // posix-style, relative to root
  ext: string;
  size: number;
  kind: FileKind;
}

export interface DirNode {
  type: "dir";
  name: string;
  path: string;
  children: TreeNode[];
}

export type TreeNode = FileNode | DirNode;

export function classifyFile(name: string, ext: string): FileKind {
  if (ext === ".md" || ext === ".markdown") return "markdown";
  if (ext === ".mmd") return "mermaid";
  if (ext && ext !== ".txt") return "code";
  return "text";
}

async function isLikelyText(absPath: string, size: number): Promise<boolean> {
  if (size > MAX_EXTENSIONLESS_SIZE) return false;
  // Sample the first 4KB and reject anything with a NUL byte, which is the
  // simplest heuristic for "this is binary".
  const fh = await fs.open(absPath, "r");
  try {
    const buf = Buffer.alloc(Math.min(4096, size));
    await fh.read(buf, 0, buf.length, 0);
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) return false;
    }
    return true;
  } finally {
    await fh.close();
  }
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

async function walkDir(root: string, current: string): Promise<TreeNode[]> {
  const abs = path.join(root, current);
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip dotfiles like .DS_Store

    const relPosix = toPosix(current ? path.join(current, entry.name) : entry.name);
    const absChild = path.join(abs, entry.name);

    if (entry.isDirectory()) {
      const children = await walkDir(root, current ? path.join(current, entry.name) : entry.name);
      // Only include the directory if it (recursively) has at least one viewable file.
      if (children.length === 0) continue;
      nodes.push({
        type: "dir",
        name: entry.name,
        path: relPosix,
        children,
      });
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    let stat: import("node:fs").Stats;
    try {
      stat = await fs.stat(absChild);
    } catch {
      continue;
    }

    if (ext) {
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    } else {
      // Extensionless files: include only if they look like plain text.
      const ok = await isLikelyText(absChild, stat.size).catch(() => false);
      if (!ok) continue;
    }

    nodes.push({
      type: "file",
      name: entry.name,
      path: relPosix,
      ext,
      size: stat.size,
      kind: classifyFile(entry.name, ext),
    });
  }

  // Sort: directories first, then files, both alphabetical.
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export async function buildTree(root: string): Promise<TreeNode[]> {
  return walkDir(root, "");
}
