import { useEffect, useRef, useState } from "react";
import type { Theme } from "../types";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
let lastInitTheme: Theme | null = null;

async function getMermaid(theme: Theme) {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  const mermaid = await mermaidPromise;
  if (lastInitTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "inherit",
    });
    lastInitTheme = theme;
  }
  return mermaid;
}

let counter = 0;
function uniqueId(): string {
  counter += 1;
  return `mmd-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

interface MermaidBlockProps {
  source: string;
  theme: Theme;
}

export function MermaidBlock({ source, theme }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const mermaid = await getMermaid(theme);
        if (cancelled) return;
        const id = uniqueId();
        const { svg } = await mermaid.render(id, source);
        if (cancelled) return;
        if (ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, theme]);

  return (
    <div className="mermaid-wrap">
      <div className="mermaid-toolbar">
        <button type="button" className="mini-button" onClick={() => setShowSource((v) => !v)}>
          {showSource ? "Hide source" : "View source"}
        </button>
      </div>
      {error ? (
        <pre className="mermaid-error">Mermaid error: {error}</pre>
      ) : (
        <div className="mermaid-render" ref={ref} />
      )}
      {showSource && <pre className="mermaid-source">{source}</pre>}
    </div>
  );
}
