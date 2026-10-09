import type { Prefs } from "../hooks/usePrefs";

interface Props {
  prefs: Prefs;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
}

export function Toolbar({ prefs, onOpenSearch, onOpenHelp }: Props) {
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <button
          type="button"
          className="icon-button"
          onClick={prefs.toggleSidebar}
          title={prefs.sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
      </div>
      <button type="button" className="search-trigger" onClick={onOpenSearch}>
        <span>Search docs</span>
        <kbd>{modKey}K</kbd>
      </button>
      <div className="toolbar-right">
        <div className="zoom-group" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="icon-button"
            onClick={() => prefs.stepFontScale(-1)}
            title="Smaller text"
            aria-label="Decrease font size"
          >
            A−
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={prefs.resetFontScale}
            title="Reset zoom"
            aria-label="Reset font size"
          >
            {Math.round(prefs.fontScale * 100)}%
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => prefs.stepFontScale(1)}
            title="Larger text"
            aria-label="Increase font size"
          >
            A+
          </button>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={prefs.toggleNotes}
          title={prefs.notesOpen ? "Hide notes" : "Show notes"}
          aria-pressed={prefs.notesOpen}
        >
          📓
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={prefs.toggleTheme}
          title={`${prefs.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} (${modKey}\\)`}
          aria-label="Toggle theme"
        >
          {prefs.theme === "dark" ? "☀" : "☾"}
        </button>
        <button
          type="button"
          className="icon-button help-button"
          onClick={onOpenHelp}
          title="Keyboard shortcuts (?)"
          aria-label="Show keyboard shortcuts"
        >
          ?
        </button>
      </div>
    </header>
  );
}
