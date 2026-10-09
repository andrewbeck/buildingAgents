import type { DocumentResponse, NoteEntry, ProgressEntry, TreeNode } from "../types";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error ?? "";
    } catch {
      // ignore
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async tree(): Promise<{ root: string; nodes: TreeNode[] }> {
    return request("/api/tree");
  },
  async file(relPath: string): Promise<DocumentResponse> {
    const q = new URLSearchParams({ path: relPath }).toString();
    return request(`/api/file?${q}`);
  },
  async saveFile(relPath: string, content: string): Promise<DocumentResponse> {
    return request(`/api/file`, {
      method: "PUT",
      body: JSON.stringify({ path: relPath, content }),
    });
  },
  async getNotes(): Promise<{ notes: Record<string, NoteEntry> }> {
    return request("/api/notes");
  },
  async putNote(relPath: string, body: string, anchors: Record<string, string> = {}): Promise<{ path: string; entry: NoteEntry }> {
    return request("/api/notes", {
      method: "PUT",
      body: JSON.stringify({ path: relPath, body, anchors }),
    });
  },
  async getProgress(): Promise<{ progress: Record<string, ProgressEntry> }> {
    return request("/api/progress");
  },
  async putProgress(relPath: string, read: boolean): Promise<{ path: string; entry: ProgressEntry }> {
    return request("/api/progress", {
      method: "PUT",
      body: JSON.stringify({ path: relPath, read }),
    });
  },
};
