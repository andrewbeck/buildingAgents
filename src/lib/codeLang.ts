// Map filename / extension to highlight.js language hints.

const EXT_TO_LANG: Record<string, string> = {
  ".py": "python",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".json": "json",
  ".toml": "toml",
  ".sh": "bash",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".mmd": "mermaid",
  ".md": "markdown",
  ".markdown": "markdown",
  ".txt": "plaintext",
};

export function langForExt(ext: string): string {
  return EXT_TO_LANG[ext.toLowerCase()] ?? "plaintext";
}
