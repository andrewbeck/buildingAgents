import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DocumentResponse } from "../types";

export function useDocument(relPath: string | null) {
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!relPath) {
      setDoc(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .file(relPath)
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relPath]);

  const replaceDoc = useCallback((next: DocumentResponse) => {
    setDoc(next);
  }, []);

  return { doc, loading, error, replaceDoc };
}
