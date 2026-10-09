import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, useLocation, useParams } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { DocumentView } from "./components/DocumentView";
import { SearchPalette } from "./components/SearchPalette";
import { NotesPanel } from "./components/NotesPanel";
import { ShortcutsHelp } from "./components/ShortcutsHelp";
import { usePrefs } from "./hooks/usePrefs";
import { useTree } from "./hooks/useTree";
import { useSearchIndex } from "./hooks/useSearchIndex";
import { useNotes } from "./hooks/useNotes";
import { useProgress } from "./hooks/useProgress";

function useGlobalKeybinds(opts: {
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleTheme: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      // `?` opens the shortcuts help (no modifier, only when not typing).
      if (!mod && !inField && e.key === "?") {
        e.preventDefault();
        opts.onOpenHelp();
        return;
      }

      if (!mod) return;
      // ⌘K works even inside form fields.
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        opts.onOpenSearch();
        return;
      }
      if (inField) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        opts.zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        opts.zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        opts.zoomReset();
      } else if (e.key === "\\") {
        e.preventDefault();
        opts.toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts]);
}

export default function App() {
  const prefs = usePrefs();
  const tree = useTree();
  const search = useSearchIndex(tree.nodes);
  const notes = useNotes();
  const progress = useProgress();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const currentFolder = useMemo(() => {
    const prefix = "/doc/";
    if (!location.pathname.startsWith(prefix)) return null;
    const rel = decodeURIComponent(location.pathname.slice(prefix.length));
    const slash = rel.lastIndexOf("/");
    return slash === -1 ? null : rel.slice(0, slash);
  }, [location.pathname]);

  useGlobalKeybinds({
    onOpenSearch: () => setPaletteOpen(true),
    onOpenHelp: () => setHelpOpen(true),
    zoomIn: () => prefs.stepFontScale(1),
    zoomOut: () => prefs.stepFontScale(-1),
    zoomReset: prefs.resetFontScale,
    toggleTheme: prefs.toggleTheme,
  });

  const hasNote = useCallback((p: string) => Boolean(notes.notes[p]?.body?.trim()), [notes.notes]);

  return (
    <div className={`app${prefs.sidebarOpen ? "" : " sidebar-hidden"}${prefs.notesOpen ? " notes-open" : ""}`}>
      <Toolbar
        prefs={prefs}
        onOpenSearch={() => setPaletteOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <div className="layout">
        {prefs.sidebarOpen && (
          <Sidebar
            nodes={tree.nodes}
            loading={tree.loading}
            error={tree.error}
            onRefresh={tree.refresh}
            isRead={progress.isRead}
            hasNote={hasNote}
          />
        )}
        <main id="doc-scroll" className="content">
          <Routes>
            <Route path="/" element={<DocumentRoute prefs={prefs} progress={progress} notes={notes} />} />
            <Route
              path="/doc/*"
              element={<DocumentRoute prefs={prefs} progress={progress} notes={notes} />}
            />
          </Routes>
        </main>
      </div>
      <SearchPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        search={search.search}
        building={search.building}
        ready={search.ready}
        currentFolder={currentFolder}
      />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function DocumentRoute({
  prefs,
  progress,
  notes,
}: {
  prefs: ReturnType<typeof usePrefs>;
  progress: ReturnType<typeof useProgress>;
  notes: ReturnType<typeof useNotes>;
}) {
  const params = useParams();
  const relPath = params["*"] ? decodeURIComponent(params["*"]) : null;

  const note = useMemo(
    () => (relPath ? notes.noteFor(relPath) : { body: "", anchors: {}, updatedAt: "" }),
    [relPath, notes],
  );

  return (
    <div className="content-inner">
      <DocumentView
        relPath={relPath}
        theme={prefs.theme}
        isRead={relPath ? progress.isRead(relPath) : false}
        onToggleRead={(read) => relPath && progress.setRead(relPath, read)}
      />
      <NotesPanel
        open={prefs.notesOpen}
        onClose={() => prefs.setNotesOpen(false)}
        relPath={relPath}
        note={note}
        onChange={(p, body) => notes.setNote(p, body, note.anchors)}
      />
    </div>
  );
}
