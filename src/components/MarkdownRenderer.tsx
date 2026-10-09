import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { MermaidBlock } from "./MermaidBlock";
import type { Theme } from "../types";

interface Props {
  source: string;
  theme: Theme;
  docPath?: string | null;
}

function resolveDocLink(href: string, docPath: string | null | undefined): string | null {
  if (!href) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return null;
  if (href.startsWith("#")) return null;

  const [rawPath, ...hashParts] = href.split("#");
  const hash = hashParts.length ? "#" + hashParts.join("#") : "";
  const cleanPath = rawPath.replace(/^\.\//, "");
  if (!cleanPath) return null;

  let resolved: string;
  if (cleanPath.startsWith("/")) {
    resolved = cleanPath.replace(/^\/+/, "");
  } else {
    const baseDir = docPath ? docPath.replace(/[^/]*$/, "") : "";
    const segments = (baseDir + cleanPath).split("/");
    const stack: string[] = [];
    for (const seg of segments) {
      if (!seg || seg === ".") continue;
      if (seg === "..") {
        stack.pop();
        continue;
      }
      stack.push(seg);
    }
    resolved = stack.join("/");
  }

  if (!resolved) return null;
  return `/doc/${encodeURIComponent(resolved)}${hash}`;
}

function isMermaidChild(children: React.ReactNode): boolean {
  let found = false;
  const visit = (nodes: React.ReactNode) => {
    if (found) return;
    if (Array.isArray(nodes)) {
      nodes.forEach(visit);
      return;
    }
    if (nodes && typeof nodes === "object" && "props" in nodes) {
      const child = nodes as React.ReactElement<{ className?: string }>;
      if (typeof child.props?.className === "string" && /language-mermaid/.test(child.props.className)) {
        found = true;
      }
    }
  };
  visit(children);
  return found;
}

function CodeBlockPre(props: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  if (isMermaidChild(props.children)) {
    return <pre {...props} />;
  }
  const onCopy = async () => {
    const text = preRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <div className="code-block">
      <button
        type="button"
        className="code-copy-button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre {...props} ref={preRef} />
    </div>
  );
}

export function MarkdownRenderer({ source, theme, docPath }: Props) {
  const components = useMemo(
    () => ({
      pre: CodeBlockPre,
      code(props: { className?: string; children?: React.ReactNode; node?: unknown }) {
        const className = props.className ?? "";
        const lang = /language-(\w+)/.exec(className)?.[1] ?? "";
        const isBlock = Boolean(lang) || (typeof props.children === "string" && props.children.includes("\n"));
        if (lang === "mermaid" && typeof props.children === "string") {
          return <MermaidBlock source={props.children.replace(/\n$/, "")} theme={theme} />;
        }
        if (!isBlock) {
          return <code className={className}>{props.children}</code>;
        }
        return (
          <code className={className} data-lang={lang || "plaintext"}>
            {props.children}
          </code>
        );
      },
      a(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        const href = props.href ?? "";
        const isExternal = /^(https?:|mailto:)/.test(href);
        const isAnchor = href.startsWith("#");
        const internalDoc = !isExternal && !isAnchor ? resolveDocLink(href, docPath) : null;
        const finalHref = internalDoc ?? href;
        const openInNewTab = isExternal || Boolean(internalDoc);
        return (
          <a
            {...props}
            href={finalHref}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
          />
        );
      },
    }),
    [theme, docPath],
  );

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={components as never}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
