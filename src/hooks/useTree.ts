import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { TreeNode } from "../types";

export function useTree() {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [root, setRoot] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.tree();
      setNodes(result.nodes);
      setRoot(result.root);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { nodes, root, loading, error, refresh };
}

export function flattenFiles(nodes: TreeNode[]): import("../types").FileNode[] {
  const out: import("../types").FileNode[] = [];
  const walk = (xs: TreeNode[]) => {
    for (const n of xs) {
      if (n.type === "file") out.push(n);
      else walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
