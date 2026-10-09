import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ProgressEntry } from "../types";

export function useProgress() {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getProgress()
      .then((r) => {
        setProgress(r.progress);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setRead = useCallback((relPath: string, read: boolean) => {
    setProgress((prev) => {
      const next = { ...prev };
      if (read) {
        next[relPath] = { read: true, readAt: new Date().toISOString() };
      } else {
        delete next[relPath];
      }
      return next;
    });
    api.putProgress(relPath, read).catch((err) => {
      console.error("[progress] save failed:", err);
    });
  }, []);

  const isRead = useCallback((relPath: string) => Boolean(progress[relPath]?.read), [progress]);

  return { progress, loaded, setRead, isRead };
}
