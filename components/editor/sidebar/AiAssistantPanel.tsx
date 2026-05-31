"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowUp, Sparkles, RotateCcw, Plus, Wand2, Check, AlertCircle,
  RefreshCw, Eye, EyeOff, FileStack, Loader2, Upload, SlidersHorizontal, PencilLine, History,
} from "lucide-react";
import {
  generateSectionAI, generateFullPageAI, improveSelectedCopyAI,
  type BlockContext,
} from "@/app/actions/ai";
import { useEditorStore } from "@/store/useEditorStore";
import { blockRegistry, CATEGORY_ORDER } from "@/blocks/registry";
import { OrvenixIcon } from "@/components/OrvenixLogo";
import { serializeTreeToHtml } from "@/lib/export/serializeToHtml";
import type { EditorTree } from "@/types/editor";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserMsg  = { id: string; role: "user";  text: string };
type AiMsg    = {
  id: string; role: "ai"; text: string;
  tree?: EditorTree; blockTypes?: string[];
  usedAI: boolean; tone?: "normal" | "success" | "error";
  userPrompt?: string; // the user message that triggered this
  sketchMeta?: {
    fileName: string;
    fidelity: "strict" | "balanced" | "system";
    designSystem: string | null;
  };
};
type ChatMsg  = UserMsg | AiMsg;

const SUGGESTIONS = [
  "Hero para una landing de SaaS",
  "Sección de precios con 3 planes",
  "Testimonios con social proof",
  "Formulario de contacto profesional",
];

type SketchResponse = {
  ok?: boolean;
  fileName?: string;
  fidelity?: "strict" | "balanced" | "system";
  designSystem?: string | null;
  prompt?: string;
  analysisSource?: string;
  warning?: string | null;
  preview?: {
    title: string;
    message: string;
    tree: EditorTree;
    usedAI: boolean;
  } | null;
  error?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AiAssistantPanel() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hola, soy **Orvenix AI**. Describe la sección que necesitas y la generaré con los bloques de tu proyecto.",
      usedAI: false,
    },
  ]);
  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);
  const [isSketchPending, setIsSketchPending] = useState(false);
  const [sketchFidelity, setSketchFidelity] = useState<"strict" | "balanced" | "system">("balanced");
  const [designSystem, setDesignSystem] = useState("");

  const insertTree = useEditorStore((s) => s.insertTree);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const rootId     = useEditorStore((s) => s.tree.rootId);
  const nodes      = useEditorStore((s) => s.tree.nodes);
  const websiteId  = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedNode = useEditorStore((s) =>
    s.selectedId ? s.tree.nodes[s.selectedId] : null
  );

  const listRef    = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageSequenceRef = useRef(0);
  const nextMessageId = (prefix: "u" | "a") => `${prefix}-${++messageSequenceRef.current}`;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending, isGeneratingPage]);

  useEffect(() => {
    if (!websiteId) return;
    try {
      const raw = window.localStorage.getItem(`orvenix-ai-chat:${websiteId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMsg[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => setMessages(parsed));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, [websiteId]);

  useEffect(() => {
    if (!websiteId || !isHydrated) return;
    window.localStorage.setItem(`orvenix-ai-chat:${websiteId}`, JSON.stringify(messages.slice(-30)));
  }, [isHydrated, messages, websiteId]);

  const availableBlocks = useMemo<BlockContext[]>(() =>
    CATEGORY_ORDER.flatMap((cat) =>
      Object.values(blockRegistry)
        .filter((b) => b.category === cat)
        .map((b) => ({ type: b.type, label: b.label, description: b.description ?? "", category: cat }))
    ), []
  );

  const currentBlockTypes = useMemo(() => {
    const root = nodes[rootId];
    return (root?.children ?? []).map((id) => nodes[id]?.type).filter(Boolean) as string[];
  }, [nodes, rootId]);

  const promptHistory = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];

    messages.forEach((msg) => {
      const candidate =
        msg.role === "user"
          ? msg.text.replace(/^\[Página completa\]\s*/i, "").trim()
          : msg.userPrompt?.trim() ?? "";

      if (!candidate || candidate === "[Sketch-to-Web]" || seen.has(candidate)) return;
      seen.add(candidate);
      values.push(candidate);
    });

    return values.slice(-8).reverse();
  }, [messages]);

  const sendPrompt = (text: string) => {
    if (!text.trim() || isPending) return;

    const userMsg: UserMsg = { id: nextMessageId("u"), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof generateSectionAI>>;
      try {
        result = await generateSectionAI(text.trim(), availableBlocks, currentBlockTypes, {
          siteId: websiteId,
          pageSlug: activePageSlug,
          source: "ai_assistant_panel",
        });
      } catch {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: "No pude completar la generación. Inténtalo de nuevo.",
          usedAI: false, tone: "error",
        }]);
        return;
      }

      if (!result.success) {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: result.message, usedAI: false, tone: "error",
        }]);
        return;
      }

      const blockTypes = [
        ...new Set(
          Object.values(result.tree.nodes)
            .map((n) => n.type)
            .filter((t) => t !== "section" && t !== "heading" && t !== "text" && t !== "ctaButton")
        ),
      ];

      setMessages((prev) => [...prev, {
        id: nextMessageId("a"), role: "ai",
        text: result.message,
        tree: result.tree, blockTypes,
        usedAI: result.usedAI,
        userPrompt: text.trim(),
      }]);
    });
  };

  const send = () => { sendPrompt(input); };

  const handleRegenerate = (userPrompt: string) => {
    if (!userPrompt || isPending) return;
    sendPrompt(userPrompt);
  };

  const handleEditPrompt = (prompt: string) => {
    setInput(prompt);
    queueMicrotask(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(prompt.length, prompt.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleInsert = (tree: EditorTree) => {
    insertTree({ tree, parentId: rootId });
    setInsertedIds((prev) => new Set(prev).add(tree.rootId));
    setMessages((prev) => [...prev, {
      id: nextMessageId("a"), role: "ai",
      text: "Insertado en el canvas. Selecciónalo para ajustar copy o estilo desde el inspector.",
      usedAI: false, tone: "success",
    }]);
  };

  const handleGenerateFullPage = () => {
    const desc = input.trim() || "mi negocio";
    setInput("");
    setIsGeneratingPage(true);

    const userMsg: UserMsg = {
      id: nextMessageId("u"), role: "user",
      text: `[Página completa] ${desc}`,
    };
    setMessages((prev) => [...prev, userMsg]);

    void (async () => {
      try {
        const sections = await generateFullPageAI(desc, availableBlocks, {
          siteId: websiteId,
          pageSlug: activePageSlug,
          source: "ai_full_page",
        });
        for (const { result } of sections) {
          if (result.success) {
            const blockTypes = [
              ...new Set(
                Object.values(result.tree.nodes)
                  .map((n) => n.type)
                  .filter((t) => t !== "section" && t !== "heading" && t !== "text")
              ),
            ];
            setMessages((prev) => [...prev, {
              id: nextMessageId("a"), role: "ai",
              text: result.message,
              tree: result.tree, blockTypes,
              usedAI: result.usedAI,
              userPrompt: result.title,
            }]);
          }
        }
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: `✦ Página completa generada con ${sections.filter(s => s.result.success).length} secciones. Insértalas una a una.`,
          usedAI: true, tone: "success",
        }]);
      } catch {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: "Error generando la página. Inténtalo con secciones individuales.",
          usedAI: false, tone: "error",
        }]);
      } finally {
        setIsGeneratingPage(false);
      }
    })();
  };

  const clearChat = () => {
    if (websiteId) window.localStorage.removeItem(`orvenix-ai-chat:${websiteId}`);
    setInsertedIds(new Set());
    setMessages([{
      id: "welcome", role: "ai",
      text: "Hola, soy **Orvenix AI**. Describe la sección que necesitas y la generaré con los bloques de tu proyecto.",
      usedAI: false,
    }]);
  };

  const improveSelection = (instruction: string) => {
    if (!selectedId || !selectedNode || isPending) return;

    const userMsg: UserMsg = { id: nextMessageId("u"), role: "user", text: instruction };
    setMessages((prev) => [...prev, userMsg]);

    startTransition(async () => {
      try {
        const result = await improveSelectedCopyAI({
          instruction,
          nodeType: selectedNode.type,
          props: selectedNode.props,
          context: {
            siteId: websiteId,
            pageSlug: activePageSlug,
            source: "ai_copy_edit_panel",
          },
        });

        if (!result.success) {
          setMessages((prev) => [...prev, {
            id: nextMessageId("a"), role: "ai",
            text: result.message, usedAI: false, tone: "error",
          }]);
          return;
        }

        updateNodeProps(selectedId, result.props);
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: result.message, usedAI: result.usedAI, tone: "success",
        }]);
      } catch {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"), role: "ai",
          text: "No pude aplicar la mejora al bloque seleccionado.",
          usedAI: false, tone: "error",
        }]);
      }
    });
  };

  const selectedDef = selectedNode
    ? blockRegistry[selectedNode.type as keyof typeof blockRegistry]
    : null;
  const isWorking = isPending || isGeneratingPage || isSketchPending;

  const handleSketchFile = async (file: File) => {
    if (isWorking) return;

    const userMsg: UserMsg = {
      id: nextMessageId("u"),
      role: "user",
      text: `[Sketch-to-Web] ${file.name}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSketchPending(true);

    try {
      const form = new FormData();
      form.set("file", file);
      form.set("fidelity", sketchFidelity);
      if (websiteId) form.set("siteId", websiteId);
      if (activePageSlug) form.set("pageSlug", activePageSlug);
      if (designSystem.trim()) form.set("designSystem", designSystem.trim());

      const res = await fetch("/api/sketch-to-web", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as SketchResponse;

      if (!res.ok || !data.ok || !data.prompt) {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"),
          role: "ai",
          text: data.error ?? "No pude interpretar este boceto todavía.",
          usedAI: false,
          tone: "error",
        }]);
        return;
      }

      setMessages((prev) => [...prev, {
        id: nextMessageId("a"),
        role: "ai",
        text: data.preview?.message ?? "Preparé una propuesta inicial a partir de tu referencia visual.",
        tree: data.preview?.tree,
        blockTypes: data.preview?.tree
          ? [...new Set(
              Object.values(data.preview.tree.nodes)
                .map((node) => node.type)
                .filter((type) => !["section", "heading", "text", "ctaButton"].includes(type))
            )]
          : [],
        usedAI: Boolean(data.preview?.usedAI || data.analysisSource === "anthropic-or-fallback"),
        tone: data.preview ? "success" : "normal",
        userPrompt: data.prompt,
        sketchMeta: {
          fileName: data.fileName ?? file.name,
          fidelity: data.fidelity ?? sketchFidelity,
          designSystem: data.designSystem ?? (designSystem.trim() || null),
        },
      }]);

      if (data.warning) {
        setMessages((prev) => [...prev, {
          id: nextMessageId("a"),
          role: "ai",
          text: data.warning,
          usedAI: false,
          tone: "error",
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: nextMessageId("a"),
        role: "ai",
        text: "No pude procesar el archivo. Inténtalo de nuevo con una imagen o PDF más claro.",
        usedAI: false,
        tone: "error",
      }]);
    } finally {
      setIsSketchPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2">
          <OrvenixIcon size={20} />
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white tracking-tight">Orvenix</span>
              <span className="text-[11px] font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">AI</span>
            </div>
            <div className="text-[9px] text-slate-600">Diseño web inteligente</div>
          </div>
        </div>
        <button
          type="button"
          title="Nueva conversación"
          onClick={clearChat}
          className="grid h-6 w-6 place-items-center rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            onInsert={handleInsert}
            onRegenerate={handleRegenerate}
            onEditPrompt={handleEditPrompt}
            inserted={msg.role === "ai" && !!msg.tree && insertedIds.has(msg.tree.rootId)}
          />
        ))}

        {/* Typing indicator */}
        {isWorking && (
          <div className="flex items-start gap-2">
            <div className="shrink-0 mt-0.5"><OrvenixIcon size={18} /></div>
            <div className="rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !isWorking && (
        <div className="px-3 pb-2 flex flex-col gap-1 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button"
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="truncate rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-left text-[10px] text-slate-500 transition-colors hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-slate-300">
              {s}
            </button>
          ))}
        </div>
      )}

      {promptHistory.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.05] px-3 py-2">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <History size={10} className="text-violet-400" />
            Historial de prompts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {promptHistory.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleEditPrompt(prompt)}
                title={`Editar prompt: ${prompt}`}
                className="max-w-full truncate rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[9px] text-slate-400 transition-colors hover:border-violet-400/20 hover:bg-violet-500/8 hover:text-slate-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection actions */}
      {selectedNode && (
        <div className="shrink-0 border-t border-white/[0.05] px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-slate-400">Selección activa</div>
              <div className="truncate text-[9px] text-slate-600">
                {selectedDef?.label ?? selectedNode.type} · #{selectedId?.slice(-6)}
              </div>
            </div>
            <Wand2 size={13} className="shrink-0 text-cyan-400" />
          </div>
          <div className="grid grid-cols-1 gap-1">
            {[
              "Mejora el copy del bloque seleccionado",
              "Hazlo más corporativo y premium",
              "Hazlo más breve y directo",
            ].map((action) => (
              <button key={action} type="button"
                onClick={() => improveSelection(action)}
                disabled={isWorking}
                className="motion-button truncate rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-left text-[10px] text-slate-500 hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-slate-300 disabled:opacity-40">
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.05] px-3 py-2.5">
        <div className="mb-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <Upload size={11} className="text-cyan-400" />
            Sketch-to-Web
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-[10px] text-slate-400 transition-colors hover:bg-cyan-500/10 hover:text-slate-300 disabled:opacity-40"
          >
            {isSketchPending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {isSketchPending ? "Analizando referencia..." : "Subir imagen o PDF para generar una sección"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleSketchFile(file);
            }}
          />

          <div className="mt-2 flex gap-1">
            {[
              { value: "strict", label: "Fiel" },
              { value: "balanced", label: "Balanceado" },
              { value: "system", label: "Sistema" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSketchFidelity(option.value as typeof sketchFidelity)}
                className={`flex-1 rounded-md px-2 py-1 text-[9px] font-semibold transition-colors ${
                  sketchFidelity === option.value
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative mt-2">
            <SlidersHorizontal size={10} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={designSystem}
              onChange={(e) => setDesignSystem(e.target.value)}
              placeholder="Design system opcional: fintech clara, brutalista, editorial..."
              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] py-1.5 pl-7 pr-2 text-[10px] text-slate-300 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 focus-within:border-cyan-500/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe una sección…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs text-slate-100 placeholder:text-slate-600 outline-none leading-relaxed max-h-20"
          />
          <button type="button" title="Enviar (Enter)" onClick={send}
            disabled={isWorking || input.trim().length < 3}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none">
            <ArrowUp size={12} />
          </button>
        </div>

        {/* Full page button */}
        <button
          type="button"
          onClick={handleGenerateFullPage}
          disabled={isWorking}
          title="Genera hero + servicios + testimonios + CTA en una sola acción"
          className="mt-1.5 w-full flex items-center justify-center gap-1.5 h-7 rounded-lg border border-violet-400/20 bg-violet-500/8 text-[10px] font-semibold text-violet-300 hover:bg-violet-500/15 disabled:opacity-40 transition-colors"
        >
          {isGeneratingPage ? <Loader2 size={10} className="animate-spin" /> : <FileStack size={10} />}
          {isGeneratingPage ? "Generando página…" : "Generar página completa"}
        </button>

        <p className="mt-1 text-[9px] text-slate-700 text-center">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

function ChatBubble({
  msg, onInsert, onRegenerate, onEditPrompt, inserted,
}: {
  msg: ChatMsg;
  onInsert: (tree: EditorTree) => void;
  onRegenerate: (prompt: string) => void;
  onEditPrompt: (prompt: string) => void;
  inserted?: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-indigo-600/25 border border-indigo-500/20 px-3 py-2 text-xs text-slate-200 leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  const preview = msg.tree
    ? serializeTreeToHtml(msg.tree, "preview").html
    : null;

  return (
    <div className="flex items-start gap-2">
      <div className="shrink-0 mt-0.5"><OrvenixIcon size={18} /></div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className={`rounded-xl rounded-tl-sm border px-3 py-2.5 ${
          msg.tone === "error"
            ? "border-red-500/15 bg-red-500/8"
            : msg.tone === "success"
              ? "border-emerald-500/15 bg-emerald-500/8"
              : "border-white/[0.06] bg-white/[0.04]"
        }`}>
          {msg.tone === "error" && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-red-300">
              <AlertCircle size={11} />
              Acción incompleta
            </div>
          )}
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <RenderMarkdown text={msg.text} />
          </p>

          {/* Block type badges */}
          {msg.blockTypes && msg.blockTypes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {msg.blockTypes.map((t) => (
                <span key={t}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono text-cyan-400">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* AI badge */}
        {msg.usedAI && (
          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-600">
            <Sparkles size={8} className="text-indigo-400" />
            <span className="text-indigo-400/70">Claude AI</span>
          </div>
          )}
          {!msg.usedAI && msg.role === "ai" && msg.id !== "welcome" && !msg.tone && (
            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-600">
              <Sparkles size={8} className="text-cyan-400" />
              <span className="text-cyan-400/70">Motor local</span>
            </div>
          )}

          {msg.sketchMeta && (
            <div className="mt-2 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-2.5 py-2 text-[9px] text-slate-500">
              <div className="font-semibold text-cyan-300">Referencia visual</div>
              <div className="mt-0.5 truncate">{msg.sketchMeta.fileName}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full border border-white/[0.06] px-1.5 py-0.5">{msg.sketchMeta.fidelity}</span>
                {msg.sketchMeta.designSystem && (
                  <span className="rounded-full border border-white/[0.06] px-1.5 py-0.5">{msg.sketchMeta.designSystem}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview toggle */}
        {preview && (
          <button type="button"
            onClick={() => setShowPreview((s) => !s)}
            className="flex items-center gap-1.5 text-[9px] text-slate-600 hover:text-slate-400 transition-colors">
            {showPreview ? <EyeOff size={9} /> : <Eye size={9} />}
            {showPreview ? "Ocultar preview" : "Ver preview"}
          </button>
        )}

        {/* Mini HTML preview */}
        {showPreview && preview && (
          <div className="rounded-lg border border-white/[0.06] bg-white overflow-hidden max-h-32 relative">
            <div
              className="text-[9px] transform origin-top-left overflow-hidden"
              style={{ width: "300%", transform: "scale(0.333)" }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white pointer-events-none" />
          </div>
        )}

        {/* Action buttons */}
        {msg.tree && (
          <div className="flex gap-1.5">
            <button type="button"
              onClick={() => onInsert(msg.tree!)}
              disabled={inserted}
              className="flex-1 motion-button flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 disabled:border-emerald-500/15 disabled:bg-emerald-500/10 disabled:text-emerald-300">
              {inserted ? <Check size={11} /> : <Plus size={11} />}
              {inserted ? "Insertado" : "Insertar"}
            </button>
            {msg.userPrompt && !inserted && (
              <>
                <button
                  type="button"
                  onClick={() => onEditPrompt(msg.userPrompt!)}
                  title="Editar este prompt antes de generar de nuevo"
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-violet-300 shrink-0"
                >
                  <PencilLine size={10} />
                </button>
                <button type="button"
                  onClick={() => onRegenerate(msg.userPrompt!)}
                  title="Regenerar esta sección con el mismo prompt"
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0">
                  <RefreshCw size={10} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }} />
      ))}
    </div>
  );
}

// ─── Simple bold markdown ─────────────────────────────────────────────────────

function RenderMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
