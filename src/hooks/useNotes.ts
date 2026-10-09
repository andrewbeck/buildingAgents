import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { NoteEntry } from "../types";

const EMPTY: NoteEntry = { body: "", anchors: {}, updatedAt: "" };

export function useNotes() {
  const [notes, setNotes] = useState<Record<string, NoteEntry>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getNotes()
      .then((r) => {
        setNotes(r.notes);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const setNote = useCallback((relPath: string, body: string, anchors: Record<string, string> = {}) => {
    setNotes((prev) => ({
      ...prev,
      [relPath]: { body, anchors, updatedAt: new Date().toISOString() },
    }));
    const timers = saveTimers.current;
    const existing = timers.get(relPath);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      api.putNote(relPath, body, anchors).catch((err) => {
        console.error("[notes] save failed:", err);
      });
      timers.delete(relPath);
    }, 500);
    timers.set(relPath, t);
  }, []);

  const noteFor = useCallback((relPath: string): NoteEntry => notes[relPath] ?? EMPTY, [notes]);

  return { notes, loaded, setNote, noteFor };
}
