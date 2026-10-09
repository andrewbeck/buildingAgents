import { useEffect, useState } from "react";
import type { NoteEntry } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  relPath: string | null;
  note: NoteEntry;
  onChange: (relPath: string, body: string) => void;
}

export function NotesPanel({ open, onClose, relPath, note, onChange }: Props) {
  const [draft, setDraft] = useState(note.body);

  useEffect(() => {
    setDraft(note.body);
  }, [relPath, note.body]);

  if (!open) return null;

  return (
    <aside className="notes-panel" aria-label="Notes for this document">
      <div className="notes-header">
        <h3>Notes</h3>
        <button type="button" className="mini-button" onClick={onClose} aria-label="Close notes">
          ✕
        </button>
      </div>
      {relPath ? (
        <>
          <div className="notes-meta muted small">{relPath}</div>
          <textarea
            className="notes-textarea"
            placeholder="Markdown notes are saved automatically."
            value={draft}
            onChange={(e) => {
              const val = e.target.value;
              setDraft(val);
              onChange(relPath, val);
            }}
          />
          {note.updatedAt && (
            <div className="notes-saved muted small">
              Saved {new Date(note.updatedAt).toLocaleTimeString()}
            </div>
          )}
        </>
      ) : (
        <div className="muted small">Open a document to take notes.</div>
      )}
    </aside>
  );
}
