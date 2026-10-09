import path from "node:path";
import fs from "node:fs/promises";

export class UnsafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafePathError";
  }
}

const NULL_BYTE = /\0/;
const CONTROL_CHARS = /[\x00-\x1f]/;

export function assertSafeRelative(rel: string): void {
  if (typeof rel !== "string" || rel.length === 0) {
    throw new UnsafePathError("path is required");
  }
  if (rel.length > 4096) {
    throw new UnsafePathError("path is too long");
  }
  if (NULL_BYTE.test(rel) || CONTROL_CHARS.test(rel)) {
    throw new UnsafePathError("path contains invalid characters");
  }
  if (path.isAbsolute(rel)) {
    throw new UnsafePathError("absolute paths are not allowed");
  }
}

/**
 * Resolve a relative path under `root`, then verify the realpath is still
 * inside `root`. This blocks `..` traversal AND symlink escapes.
 */
export async function resolveSafe(root: string, rel: string): Promise<string> {
  assertSafeRelative(rel);
  const resolved = path.resolve(root, rel);
  const rootReal = await fs.realpath(root);
  // realpath can fail if the file doesn't exist; we want a useful error.
  let resolvedReal: string;
  try {
    resolvedReal = await fs.realpath(resolved);
  } catch {
    throw new UnsafePathError("file not found");
  }
  const rootWithSep = rootReal.endsWith(path.sep) ? rootReal : rootReal + path.sep;
  if (resolvedReal !== rootReal && !resolvedReal.startsWith(rootWithSep)) {
    throw new UnsafePathError("path escapes content root");
  }
  return resolvedReal;
}
