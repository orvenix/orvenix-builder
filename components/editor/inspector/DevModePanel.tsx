"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { editor, languages } from "monaco-editor";
import type * as Monaco from "monaco-editor";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import type { NodeProps } from "@/types/editor";
import { Code2, RefreshCw, Copy, Check, Cpu } from "lucide-react";

// Monaco loads ONLY in Dev mode — verified by dynamic() with ssr:false.
// The visual mode bundle never includes Monaco.
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <MonacoSkeleton /> }
);

// ─── Tailwind CSS completions ─────────────────────────────────────────────────

const TAILWIND_COMPLETIONS: string[] = [
  // Colors (CSS vars from Tailwind v4 theme)
  "--color-slate-50", "--color-slate-100", "--color-slate-200", "--color-slate-300",
  "--color-slate-400", "--color-slate-500", "--color-slate-600", "--color-slate-700",
  "--color-slate-800", "--color-slate-900", "--color-slate-950",
  "--color-blue-400", "--color-blue-500", "--color-blue-600",
  "--color-indigo-400", "--color-indigo-500", "--color-indigo-600",
  "--color-violet-400", "--color-violet-500", "--color-violet-600",
  "--color-emerald-400", "--color-emerald-500", "--color-emerald-600",
  "--color-amber-400", "--color-amber-500", "--color-amber-600",
  "--color-red-400", "--color-red-500", "--color-red-600",
  "--color-white", "--color-black",
  // Spacing (rem scale)
  "--spacing-1", "--spacing-2", "--spacing-4", "--spacing-6", "--spacing-8",
  "--spacing-10", "--spacing-12", "--spacing-16", "--spacing-20", "--spacing-24",
  // Typography
  "--font-sans", "--font-mono",
  "--text-xs", "--text-sm", "--text-base", "--text-lg", "--text-xl",
  "--text-2xl", "--text-3xl", "--text-4xl", "--text-5xl", "--text-6xl",
  // Border radius
  "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl",
  "--radius-full",
  // Shadows
  "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl",
];

function registerTailwindCompletions(monacoInstance: typeof Monaco) {
  monacoInstance.languages.registerCompletionItemProvider("css", {
    triggerCharacters: ["-", "v", "("],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: languages.CompletionItem["range"] = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const items: languages.CompletionItem[] = TAILWIND_COMPLETIONS.map((v) => ({
        label: v,
        kind: monacoInstance.languages.CompletionItemKind.Variable,
        insertText: v.startsWith("--") ? `var(${v})` : v,
        documentation: `Tailwind CSS variable: ${v}`,
        range,
      }));
      return { suggestions: items };
    },
  });
}

// ─── Safe CSS serialization ───────────────────────────────────────────────────

function nodePropsToCss(props: NodeProps): string {
  const r = props as Record<string, unknown>;
  const lines: string[] = [];
  const add = (p: string, v: string) => { if (v) lines.push(`  ${p}: ${v};`); };

  if (r.positionMode === "free") {
    add("position", "absolute");
    if (typeof r.x === "number") add("left", `${r.x}px`);
    if (typeof r.y === "number") add("top", `${r.y}px`);
    if (typeof r.width === "number") add("width", `${r.width}px`);
    if (typeof r.height === "number") add("height", `${r.height}px`);
  }
  if (r.styleBackground)  add("background", String(r.styleBackground));
  if (typeof r.styleOpacity === "number" && r.styleOpacity < 100)
    add("opacity", String(r.styleOpacity / 100));
  if (typeof r.stylePadding === "number" && r.stylePadding > 0)
    add("padding", `${r.stylePadding}px`);
  if (typeof r.styleRadius === "number" && r.styleRadius > 0)
    add("border-radius", `${r.styleRadius}px`);
  if (typeof r.styleBorderWidth === "number" && r.styleBorderWidth > 0) {
    add("border-width", `${r.styleBorderWidth}px`);
    add("border-style", "solid");
    if (r.styleBorderColor) add("border-color", String(r.styleBorderColor));
  }

  const custom = typeof r.customCss === "string" ? r.customCss.trim() : "";
  const base = lines.length > 0
    ? `/* Estilos generados */\n.bloque {\n${lines.join("\n")}\n}`
    : "";
  const customBlock = custom
    ? `\n\n/* CSS personalizado */\n.bloque {\n  ${custom.replace(/\n/g, "\n  ")}\n}`
    : "";

  return (base + customBlock).trim() || "/* Sin estilos — escribe CSS aquí */\n.bloque {\n  \n}";
}

// ─── Safe CSS parser (CSSOM-based) ───────────────────────────────────────────

/**
 * Parses a CSS rule block using the browser's built-in CSSOM instead of regex.
 * Returns a map of property → value for all valid declarations found.
 */
function parseCssDeclarations(cssBlock: string): Record<string, string> {
  if (typeof document === "undefined") return {};
  const el = document.createElement("div");
  // Wrap in a rule to let the browser parse it
  el.style.cssText = cssBlock;
  const result: Record<string, string> = {};
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    result[prop] = el.style.getPropertyValue(prop);
  }
  return result;
}

function cssToNodePropsPatch(css: string): NodeProps {
  const patch: NodeProps = {};

  // Extract and preserve the custom block
  const customMatch = css.match(/\/\* CSS personalizado \*\/\s*\.bloque\s*\{([^}]*)\}/);
  if (customMatch?.[1]) {
    const lines = customMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
    patch.customCss = lines.join("\n");
  } else {
    // If there's no explicit custom block, everything not in the generated block is custom
    const withoutGenerated = css
      .replace(/\/\* Estilos generados \*\/[\s\S]*?\}/, "")
      .replace(/\/\*[^*]*\*\//g, "")
      .trim();
    const innerMatch = withoutGenerated.match(/\.bloque\s*\{([^}]*)\}/);
    if (innerMatch?.[1]) {
      const raw = innerMatch[1].trim();
      if (raw) patch.customCss = raw;
    }
  }

  // Parse the generated block using CSSOM
  const generatedMatch = css.match(/\/\* Estilos generados \*\/\s*\.bloque\s*\{([^}]*)\}/);
  if (generatedMatch?.[1]) {
    const decls = parseCssDeclarations(generatedMatch[1]);
    if (decls["background"]) patch.styleBackground = decls["background"];
    if (decls["background-color"]) patch.styleBackground = decls["background-color"];
    if (decls["opacity"]) patch.styleOpacity = Math.round(parseFloat(decls["opacity"]) * 100);
    if (decls["padding"]) patch.stylePadding = parseInt(decls["padding"], 10);
    if (decls["border-radius"]) patch.styleRadius = parseInt(decls["border-radius"], 10);
    if (decls["border-width"]) patch.styleBorderWidth = parseInt(decls["border-width"], 10);
    if (decls["border-color"]) patch.styleBorderColor = decls["border-color"];
  }

  return patch;
}

// ─── Computed styles ──────────────────────────────────────────────────────────

const COMPUTED_PROPS = [
  "display", "position", "width", "height", "min-height",
  "padding", "margin", "border", "border-radius",
  "background", "background-color", "color",
  "font-size", "font-weight", "line-height",
  "flex-direction", "align-items", "justify-content", "gap",
  "overflow", "z-index", "opacity", "box-shadow", "transform",
] as const;

interface ComputedEntry { prop: string; value: string; }

function getComputedEntries(nodeId: string): ComputedEntry[] {
  if (typeof window === "undefined") return [];
  const el = document.getElementById(`node-${nodeId}`);
  if (!el) return [];
  const cs = window.getComputedStyle(el);
  return COMPUTED_PROPS
    .map((p) => ({ prop: p, value: cs.getPropertyValue(p).trim() }))
    .filter((e) => e.value && e.value !== "none" && e.value !== "normal" && e.value !== "auto");
}

// ─── Component ────────────────────────────────────────────────────────────────

type DevTab = "css" | "computed";

export function DevModePanel() {
  const selectedId      = useEditorStore((s) => s.selectedId);
  const node            = useEditorStore((s) => s.selectedId ? s.tree.nodes[s.selectedId] : null);
  const currentDevice   = useEditorStore((s) => s.currentDevice);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);

  const resolvedProps   = node ? resolveResponsiveProps(node.props, currentDevice) : null;
  const [cssValue, setCssValue] = useState("");
  const [copied, setCopied]     = useState(false);
  const [isDirty, setIsDirty]   = useState(false);
  const [activeTab, setActiveTab] = useState<DevTab>("css");
  const [computedEntries, setComputedEntries] = useState<ComputedEntry[]>([]);
  const editorRef          = useRef<editor.IStandaloneCodeEditor | null>(null);
  const applyTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNodeIdRef      = useRef<string | null>(null);
  const completionsRef     = useRef(false);

  // Sync Monaco when selected node changes
  useEffect(() => {
    if (!node || node.id === lastNodeIdRef.current) return;
    lastNodeIdRef.current = node.id;
    const css = nodePropsToCss(resolvedProps ?? {});
    setCssValue(css);
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && model.getValue() !== css) model.setValue(css);
    }
    setIsDirty(false);
  }, [node, resolvedProps]);

  // Refresh computed styles when switching to computed tab.
  // Deferred via setTimeout so the DOM has painted before reading getComputedStyle.
  useEffect(() => {
    if (activeTab !== "computed" || !selectedId) return;
    const id = window.setTimeout(() => setComputedEntries(getComputedEntries(selectedId)), 0);
    return () => window.clearTimeout(id);
  }, [activeTab, selectedId]);

  const handleEditorMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) => {
      editorRef.current = ed;
      // Register Tailwind completions only once per session
      if (!completionsRef.current) {
        registerTailwindCompletions(monacoInstance);
        completionsRef.current = true;
      }
    },
    []
  );

  const handleChange = useCallback((value: string | undefined) => {
    const next = value ?? "";
    setCssValue(next);
    setIsDirty(true);
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      if (selectedId) {
        updateNodeProps(selectedId, cssToNodePropsPatch(next));
        setIsDirty(false);
      }
    }, 600);
  }, [selectedId, updateNodeProps]);

  const applyNow = useCallback(() => {
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    if (selectedId) {
      updateNodeProps(selectedId, cssToNodePropsPatch(cssValue));
      setIsDirty(false);
    }
  }, [cssValue, selectedId, updateNodeProps]);

  const reset = useCallback(() => {
    if (!resolvedProps) return;
    const css = nodePropsToCss(resolvedProps);
    setCssValue(css);
    editorRef.current?.getModel()?.setValue(css);
    setIsDirty(false);
  }, [resolvedProps]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(cssValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [cssValue]);

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center">
          <Code2 size={18} className="text-emerald-400/60" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-45">
          Selecciona un bloque en el canvas para editar su CSS
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/15 grid place-items-center">
            <Code2 size={11} className="text-emerald-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 truncate max-w-30">
            {node.displayName ?? node.type}
          </span>
          {isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" title="Cambios sin guardar" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeTab === "css" && (
            <>
              <button type="button" title="Copiar CSS" onClick={copyToClipboard}
                className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
              <button type="button" title="Restablecer" onClick={reset}
                className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                <RefreshCw size={11} />
              </button>
            </>
          )}
          {activeTab === "computed" && (
            <button type="button" title="Refrescar estilos" onClick={() => selectedId && setComputedEntries(getComputedEntries(selectedId))}
              className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
              <RefreshCw size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {(["css", "computed"] as DevTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? "border-b-2 border-emerald-400 text-emerald-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "css" ? <Code2 size={9} /> : <Cpu size={9} />}
            {tab === "css" ? "Editor" : "Computed"}
          </button>
        ))}
      </div>

      {/* CSS Tab */}
      {activeTab === "css" && (
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            language="css"
            theme="vs-dark"
            value={cssValue}
            onChange={handleChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', ui-monospace, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              renderLineHighlight: "gutter",
              padding: { top: 8, bottom: 8 },
              suggest: { showKeywords: true, showSnippets: true },
              scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
            }}
          />
        </div>
      )}

      {/* Computed Tab */}
      {activeTab === "computed" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {computedEntries.length === 0 ? (
            <p className="px-4 py-6 text-[11px] text-slate-500 text-center">
              No hay estilos computados relevantes. ¿El bloque está visible en el canvas?
            </p>
          ) : (
            <table className="w-full text-[10px] font-mono">
              <tbody>
                {computedEntries.map(({ prop, value }) => (
                  <tr key={prop} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 text-slate-400 whitespace-nowrap w-1/2">{prop}</td>
                    <td className="px-3 py-1.5 text-emerald-300 truncate max-w-0 w-1/2" title={value}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Apply bar (CSS tab only) */}
      {activeTab === "css" && isDirty && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 bg-amber-500/5 shrink-0">
          <span className="text-[10px] text-amber-400/80">Cambios pendientes</span>
          <button type="button" onClick={applyNow}
            className="h-6 px-2.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/30 transition-colors">
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

const SKELETON_WIDTHS = ["w-[55%]", "w-[67%]", "w-[79%]", "w-[91%]"] as const;

function MonacoSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`h-3 rounded bg-white/4 ${SKELETON_WIDTHS[i % 4]}`} />
      ))}
    </div>
  );
}
