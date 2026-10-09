import { useEffect, useMemo, useState } from "react";
import MiniSearch from "minisearch";
import { api } from "../lib/api";
import { flattenFiles } from "./useTree";
import type { FileNode, TreeNode } from "../types";

interface IndexedDoc {
  id: string;
  path: string;
  name: string;
  course: string;
  content: string;
}

function courseOf(file: FileNode): string {
  const slash = file.path.indexOf("/");
  return slash === -1 ? file.path : file.path.slice(0, slash);
}

export interface SearchHit {
  path: string;
  name: string;
  course: string;
  score: number;
  match: string;
}

export function useSearchIndex(nodes: TreeNode[]) {
  const [docs, setDocs] = useState<Map<string, IndexedDoc>>(new Map());
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const files = flattenFiles(nodes);
    if (files.length === 0) {
      setDocs(new Map());
      return;
    }
    setBuilding(true);

    (async () => {
      const next = new Map<string, IndexedDoc>();
      // Limit concurrency so we don't slam the local server.
      const concurrency = 4;
      let idx = 0;
      async function worker() {
        while (idx < files.length) {
          const i = idx++;
          const file = files[i];
          try {
            const doc = await api.file(file.path);
            next.set(file.path, {
              id: file.path,
              path: file.path,
              name: file.name,
              course: courseOf(file),
              content: doc.content,
            });
          } catch {
            // skip
          }
        }
      }
      await Promise.all(Array.from({ length: concurrency }, worker));
      if (!cancelled) {
        setDocs(next);
        setBuilding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nodes]);

  const index = useMemo(() => {
    const ms = new MiniSearch<IndexedDoc>({
      fields: ["name", "course", "content"],
      storeFields: ["path", "name", "course", "content"],
      searchOptions: {
        boost: { name: 3, course: 1.5, content: 1 },
        prefix: true,
        fuzzy: 0.2,
      },
    });
    ms.addAll(Array.from(docs.values()));
    return ms;
  }, [docs]);

  function search(
    query: string,
    opts: { folder?: string | null; limit?: number } = {},
  ): SearchHit[] {
    const { folder, limit = 25 } = opts;
    const q = query.trim();
    if (!q) return [];
    let results = index.search(q);
    if (folder) {
      const prefix = folder.endsWith("/") ? folder : folder + "/";
      results = results.filter((r) => (r.id as string).startsWith(prefix));
    }
    results = results.slice(0, limit);
    return results.map((r) => {
      const content = (r as unknown as { content?: string }).content ?? "";
      const match = makeSnippet(content, q);
      return {
        path: r.id as string,
        name: r.name as string,
        course: r.course as string,
        score: r.score,
        match,
      };
    });
  }

  return { search, building, ready: docs.size > 0 };
}

function makeSnippet(content: string, query: string): string {
  if (!content) return "";
  const lower = content.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  let bestIdx = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1 && (bestIdx === -1 || i < bestIdx)) bestIdx = i;
  }
  if (bestIdx === -1) bestIdx = 0;
  const start = Math.max(0, bestIdx - 60);
  const end = Math.min(content.length, bestIdx + 140);
  let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "…" + snippet;
  if (end < content.length) snippet += "…";
  return snippet;
}
