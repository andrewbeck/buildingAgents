import { useCallback, useEffect, useRef, useState } from "react";
import { useDocument } from "../hooks/useDocument";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MermaidBlock } from "./MermaidBlock";
import { langForExt } from "../lib/codeLang";
import { api } from "../lib/api";
import type { DocumentResponse, Theme } from "../types";

interface Props {
  relPath: string | null;
  theme: Theme;
  isRead: boolean;
  onToggleRead: (read: boolean) => void;
  onLoaded?: (path: string) => void;
}

const SCROLL_STORAGE_KEY = "docScrollPositions";

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePositions(positions: Record<string, number>) {
  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function DocumentView({ relPath, theme, isRead, onToggleRead, onLoaded }: Props) {
  const { doc, loading, error, replaceDoc } = useDocument(relPath);
  const positionsRef = useRef<Record<string, number>>(readPositions());
  const trackedPathRef = useRef<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Reset edit state when the document changes.
  useEffect(() => {
    setEditing(false);
    setDraft("");
    setSaving(false);
    setSaveError(null);
    setSavedAt(null);
  }, [relPath]);

  // Clear the tracked path while the next doc is loading so the scroll-to-zero
  // that happens when content unmounts doesn't overwrite the previous doc's
  // saved position.
  useEffect(() => {
    trackedPathRef.current = null;
  }, [relPath]);

  // Restore scroll on doc change: URL hash > saved position > top.
  useEffect(() => {
    if (!doc) return;
    if (onLoaded) onLoaded(doc.path);

    const main = document.getElementById("doc-scroll");
    if (!main) return;

    const restore = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const target = document.getElementById(decodeURIComponent(hash));
        if (target) {
          target.scrollIntoView({ block: "start" });
          trackedPathRef.current = doc.path;
          return;
        }
      }
      const saved = positionsRef.current[doc.path];
      main.scrollTo({ top: saved ?? 0 });
      trackedPathRef.current = doc.path;
    };

    // Wait one frame so headings (and their slug ids) are committed to the DOM.
    const raf = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(raf);
  }, [doc, onLoaded]);

  // Persist scroll position for the active doc.
  useEffect(() => {
    const main = document.getElementById("doc-scroll");
    if (!main) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const path = trackedPathRef.current;
        if (!path) return;
        positionsRef.current[path] = main.scrollTop;
        writePositions(positionsRef.current);
      });
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      main.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const startEditing = useCallback(() => {
    if (!doc) return;
    setDraft(doc.content);
    setSaveError(null);
    setEditing(true);
  }, [doc]);

  const cancelEditing = useCallback(() => {
    if (!doc) return;
    if (draft !== doc.content) {
      const ok = window.confirm("Discard unsaved changes?");
      if (!ok) return;
    }
    setDraft(doc.content);
    setEditing(false);
    setSaveError(null);
  }, [doc, draft]);

  const save = useCallback(async () => {
    if (!doc || saving) return;
    if (draft === doc.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const next: DocumentResponse = await api.saveFile(doc.path, draft);
      replaceDoc(next);
      setSavedAt(new Date().toISOString());
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [doc, draft, saving, replaceDoc]);

  // Toggle edit mode with `e` (when not typing) and Cmd/Ctrl+S to save.
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "s") {
        if (!editing) return;
        e.preventDefault();
        void save();
        return;
      }

      if (!editing && !mod && !inField && e.key.toLowerCase() === "e") {
        e.preventDefault();
        startEditing();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, editing, save, startEditing]);

  if (!relPath) {
    return (
      <div className="doc-empty">
        <h2>Pick a document from the sidebar.</h2>
        <p className="muted">⌘K opens search. Drop new files into your content directory and refresh.</p>
      </div>
    );
  }

  if (loading) return <div className="doc-empty"><span className="muted">Loading…</span></div>;
  if (error) return <div className="doc-empty"><span className="error">{error}</span></div>;
  if (!doc) return null;

  const dirty = editing && draft !== doc.content;

  return (
    <article className="doc">
      <header className="doc-header">
        <div className="doc-path">{doc.path}</div>
        <div className="doc-actions">
          {editing ? (
            <>
              {dirty && <span className="doc-dirty muted small">Unsaved changes</span>}
              {saveError && <span className="error small">{saveError}</span>}
              <button
                type="button"
                className="mini-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mini-button doc-save"
                onClick={save}
                disabled={saving || !dirty}
                title="Save (⌘S)"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              {savedAt && (
                <span className="doc-saved muted small">
                  Saved {new Date(savedAt).toLocaleTimeString()}
                </span>
              )}
              <label className="read-toggle">
                <input
                  type="checkbox"
                  checked={isRead}
                  onChange={(e) => onToggleRead(e.target.checked)}
                />
                <span>Mark as read</span>
              </label>
              <button
                type="button"
                className="icon-button doc-edit"
                onClick={startEditing}
                title="Edit (e)"
                aria-label="Edit document"
              >
                ✎
              </button>
            </>
          )}
        </div>
      </header>
      {editing ? (
        <DocumentEditor
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={cancelEditing}
        />
      ) : (
        <DocumentBody doc={doc} theme={theme} />
      )}
    </article>
  );
}

function DocumentEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      className="doc-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          onSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      spellCheck={false}
    />
  );
}

function DocumentBody({
  doc,
  theme,
}: {
  doc: { kind: string; ext: string; content: string; path: string };
  theme: Theme;
}) {
  if (doc.kind === "markdown") {
    return <MarkdownRenderer source={doc.content} theme={theme} docPath={doc.path} />;
  }
  if (doc.kind === "mermaid" || doc.ext === ".mmd") {
    return <MermaidBlock source={doc.content} theme={theme} />;
  }
  // Code or text — render through markdown engine wrapped in a fenced block.
  const lang = langForExt(doc.ext);
  const fenced = "```" + lang + "\n" + doc.content + "\n```";
  return <MarkdownRenderer source={fenced} theme={theme} docPath={doc.path} />;
}
