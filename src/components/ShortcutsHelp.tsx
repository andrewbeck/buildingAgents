import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  label: string;
}

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: { section: string; items: Shortcut[] }[] = [
  {
    section: "Navigation",
    items: [
      { keys: [MOD, "K"], label: "Open search" },
      { keys: ["?"], label: "Show keyboard shortcuts" },
    ],
  },
  {
    section: "View",
    items: [
      { keys: [MOD, "\\"], label: "Toggle dark / light mode" },
      { keys: [MOD, "+"], label: "Zoom in" },
      { keys: [MOD, "−"], label: "Zoom out" },
      { keys: [MOD, "0"], label: "Reset zoom" },
    ],
  },
  {
    section: "Editing",
    items: [
      { keys: ["E"], label: "Edit current document" },
      { keys: [MOD, "S"], label: "Save edits" },
      { keys: ["Esc"], label: "Cancel edits" },
    ],
  },
  {
    section: "Search palette",
    items: [
      { keys: ["↑", "↓"], label: "Move selection" },
      { keys: ["↵"], label: "Open result" },
      { keys: ["Tab"], label: "Toggle scope: all / current folder" },
      { keys: ["Esc"], label: "Close" },
    ],
  },
];

export function ShortcutsHelp({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette shortcuts-help"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h2>Keyboard shortcuts</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>
        <div className="shortcuts-body">
          {SHORTCUTS.map((group) => (
            <section key={group.section} className="shortcuts-group">
              <h3>{group.section}</h3>
              <ul>
                {group.items.map((s) => (
                  <li key={s.label}>
                    <span className="shortcuts-label">{s.label}</span>
                    <span className="shortcuts-keys">
                      {s.keys.map((k, i) => (
                        <kbd key={i}>{k}</kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
