export type FileKind = "markdown" | "mermaid" | "code" | "text";

export interface FileNode {
  type: "file";
  name: string;
  path: string;
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

export interface DocumentResponse {
  path: string;
  name: string;
  ext: string;
  size: number;
  kind: FileKind;
  content: string;
}

export interface NoteEntry {
  body: string;
  anchors: Record<string, string>;
  updatedAt: string;
}

export interface ProgressEntry {
  read: boolean;
  readAt: string | null;
}

export type Theme = "dark" | "light";
