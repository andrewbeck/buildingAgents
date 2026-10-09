import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { TreeNode } from "../types";

interface Props {
  nodes: TreeNode[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isRead: (relPath: string) => boolean;
  hasNote: (relPath: string) => boolean;
}

export function Sidebar({ nodes, loading, error, onRefresh, isRead, hasNote }: Props) {
  return (
    <nav className="sidebar" aria-label="Course navigation">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Building Agents</h1>
        <button
          type="button"
          className="mini-button"
          onClick={onRefresh}
          title="Re-scan content directory"
        >
          ↻
        </button>
      </div>
      {loading && <div className="muted small">Loading tree…</div>}
      {error && <div className="error small">{error}</div>}
      <ul className="tree">
        {nodes.map((node) => (
          <TreeNodeView key={node.path} node={node} depth={0} isRead={isRead} hasNote={hasNote} initialOpen />
        ))}
      </ul>
    </nav>
  );
}

interface NodeProps {
  node: TreeNode;
  depth: number;
  initialOpen?: boolean;
  isRead: (relPath: string) => boolean;
  hasNote: (relPath: string) => boolean;
}

function TreeNodeView({ node, depth, initialOpen = false, isRead, hasNote }: NodeProps) {
  const [open, setOpen] = useState(initialOpen);
  const location = useLocation();
  const activePath = location.pathname.startsWith("/doc/")
    ? decodeURIComponent(location.pathname.slice("/doc/".length))
    : null;

  if (node.type === "dir") {
    return (
      <li>
        <button
          type="button"
          className="tree-dir"
          style={{ paddingLeft: 8 + depth * 12 }}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="caret" aria-hidden>{open ? "▾" : "▸"}</span>
          <span className="tree-name">{node.name}</span>
          <span className="tree-count">{node.children.length}</span>
        </button>
        {open && (
          <ul className="tree-children">
            {node.children.map((child) => (
              <TreeNodeView
                key={child.path}
                node={child}
                depth={depth + 1}
                isRead={isRead}
                hasNote={hasNote}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const active = activePath === node.path;
  const read = isRead(node.path);
  const noted = hasNote(node.path);

  return (
    <li>
      <Link
        to={`/doc/${encodeURIComponent(node.path)}`}
        className={`tree-file${active ? " is-active" : ""}`}
        style={{ paddingLeft: 8 + depth * 12 }}
        title={node.path}
      >
        <span className={`progress-dot${read ? " is-read" : ""}`} aria-hidden />
        <span className="tree-name">{prettyName(node.name)}</span>
        <span className="tree-meta">
          {noted && <span className="badge note-badge" title="Has notes">●</span>}
          <span className="ext-tag">{labelForExt(node.ext)}</span>
        </span>
      </Link>
    </li>
  );
}

function prettyName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function labelForExt(ext: string): string {
  if (!ext) return "txt";
  return ext.replace(/^\./, "");
}
