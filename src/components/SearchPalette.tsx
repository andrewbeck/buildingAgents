import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SearchHit } from "../hooks/useSearchIndex";

type Scope = "all" | "folder";

interface Props {
  open: boolean;
  onClose: () => void;
  search: (q: string, opts?: { folder?: string | null; limit?: number }) => SearchHit[];
  building: boolean;
  ready: boolean;
  currentFolder: string | null;
}

export function SearchPalette({ open, onClose, search, building, ready, currentFolder }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [scope, setScope] = useState<Scope>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setScope("all");
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const folderForSearch = scope === "folder" ? currentFolder : null;
  const hits = useMemo(
    () => (query ? search(query, { folder: folderForSearch }) : []),
    [query, search, folderForSearch],
  );

  useEffect(() => {
    setActive(0);
  }, [query, scope]);

  if (!open) return null;

  const folderLabel = currentFolder ? folderName(currentFolder) : null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((v) => Math.min(hits.length - 1, v + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((v) => Math.max(0, v - 1));
      return;
    }
    if (e.key === "Tab" && currentFolder) {
      e.preventDefault();
      setScope((s) => (s === "all" ? "folder" : "all"));
      return;
    }
    if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      navigate(`/doc/${encodeURIComponent(hits[active].path)}`);
      onClose();
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          className="palette-input"
          placeholder={building ? "Building search index…" : "Search docs"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="palette-scope" role="tablist" aria-label="Search scope">
          <button
            type="button"
            role="tab"
            aria-selected={scope === "all"}
            className={`palette-scope-btn${scope === "all" ? " is-active" : ""}`}
            onClick={() => setScope("all")}
          >
            All content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "folder"}
            className={`palette-scope-btn${scope === "folder" ? " is-active" : ""}`}
            onClick={() => currentFolder && setScope("folder")}
            disabled={!currentFolder}
            title={currentFolder ?? "Open a document to scope to its folder"}
          >
            {folderLabel ? `In ${folderLabel}` : "Current folder"}
          </button>
        </div>
        <div className="palette-status">
          {!ready && building && <span className="muted small">Indexing…</span>}
          {ready && hits.length === 0 && query && <span className="muted small">No matches</span>}
          {ready && !query && (
            <span className="muted small">
              {scope === "folder" && currentFolder
                ? `Type to search within ${currentFolder}`
                : "Type to search across all docs"}
            </span>
          )}
        </div>
        <ul className="palette-results">
          {hits.map((hit, i) => (
            <li key={hit.path}>
              <button
                type="button"
                className={`palette-result${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  navigate(`/doc/${encodeURIComponent(hit.path)}`);
                  onClose();
                }}
              >
                <div className="palette-result-head">
                  <span className="palette-name">{hit.name}</span>
                  <span className="palette-course">{hit.course}</span>
                </div>
                {hit.match && <div className="palette-snippet">{hit.match}</div>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function folderName(folder: string): string {
  const slash = folder.lastIndexOf("/");
  return slash === -1 ? folder : folder.slice(slash + 1);
}
