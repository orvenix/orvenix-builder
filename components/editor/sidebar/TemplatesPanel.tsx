"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCheck, ExternalLink, Search, Sparkles, Undo2, X } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/templates";
import type { Template } from "@/templates";

const priceFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "MXN",
});

export function TemplatesPanel() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<Template | null>(null);
  const replaceTree = useEditorStore((s) => s.replaceTree);
  const undo = useEditorStore((s) => s.undo);

  useEffect(() => {
    if (!appliedTemplate) return;

    const timeoutId = window.setTimeout(() => setAppliedTemplate(null), 7000);
    return () => window.clearTimeout(timeoutId);
  }, [appliedTemplate]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = TEMPLATES.filter((template) => {
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    const haystack = [
      template.name,
      template.category,
      template.description,
      ...template.features,
    ].join(" ").toLowerCase();

    return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
  });

  const handleConfirmInsert = () => {
    if (!pendingTemplate) return;
    replaceTree(pendingTemplate.tree, `replace-template:${pendingTemplate.name}`);
    setAppliedTemplate(pendingTemplate);
    setPendingTemplate(null);
  };

  const handleUndoReplace = () => {
    undo();
    setAppliedTemplate(null);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#09101a] text-slate-200">
      <div className="shrink-0 border-b border-white/[0.06] p-3">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">Sitios reales</p>
            <p className="truncate text-[11px] text-slate-500">{TEMPLATES.length} webs completas listas para editar</p>
          </div>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por industria o función"
            className="h-9 w-full rounded-lg border border-white/[0.07] bg-white/[0.035] pl-9 pr-3 text-xs text-slate-200 outline-none transition focus:border-emerald-400/35 focus:bg-white/[0.055]"
          />
        </label>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] p-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-semibold transition-colors ${
              activeCategory === cat.id
                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25"
                : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {filtered.map((template) => (
          <article
            key={template.id}
            className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.035] transition hover:border-emerald-400/30 hover:bg-white/[0.055]"
          >
            <div
              className="relative h-28 bg-cover bg-center"
              style={{ backgroundImage: `url(${template.preview})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#09101a] via-[#09101a]/30 to-transparent" />
              <div
                className="absolute left-3 top-3 rounded-full border px-2 py-1 text-[10px] font-bold"
                style={{ borderColor: `${template.accent}55`, backgroundColor: `${template.accent}22`, color: template.accent }}
              >
                {template.category}
              </div>
            </div>
            <div className="space-y-3 p-3">
              <div>
                <h3 className="text-sm font-black leading-tight text-white">{template.name}</h3>
                <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-500">{template.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {template.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: template.accent }} />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Compra</p>
                  <p className="truncate text-xs font-bold text-slate-300">{priceFormatter.format(template.purchasePriceMxn)}</p>
                </div>
                <a
                  href={template.livePath}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:border-white/20 hover:text-white"
                  title="Abrir demo"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPendingTemplate(template)}
                  className="h-8 shrink-0 rounded-lg bg-emerald-500 px-3 text-[11px] font-black text-emerald-950 transition hover:bg-emerald-400"
                >
                  Usar sitio
                </button>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-4 text-center text-xs leading-5 text-slate-500">
            No hay sitios que coincidan con tu búsqueda.
          </div>
        )}
      </div>

      <Dialog.Root open={Boolean(pendingTemplate)} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm editor-anim-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1117] text-white shadow-2xl shadow-black/50 editor-anim-scale-in">
            {pendingTemplate && (
              <>
                <div
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${pendingTemplate.preview})` }}
                >
                  <div className="flex h-full items-start justify-end bg-gradient-to-b from-black/40 to-[#0d1117] p-3">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/30 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        aria-label="Cerrar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div>
                    <div
                      className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ borderColor: `${pendingTemplate.accent}55`, backgroundColor: `${pendingTemplate.accent}18`, color: pendingTemplate.accent }}
                    >
                      {pendingTemplate.category}
                    </div>
                    <Dialog.Title className="text-lg font-black leading-tight">
                      Usar {pendingTemplate.name}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-slate-400">
                      Esto reemplazara el sitio actual por esta web completa. El cambio queda en el historial y puedes deshacerlo con Ctrl+Z.
                    </Dialog.Description>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {pendingTemplate.features.slice(0, 4).map((feature) => (
                      <div key={feature} className="rounded-lg border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-[11px] text-slate-300">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="h-9 rounded-lg border border-white/[0.08] px-3 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Cancelar
                      </button>
                    </Dialog.Close>
                    <button
                      type="button"
                      onClick={handleConfirmInsert}
                      className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-black text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Reemplazar sitio
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {appliedTemplate && (
        <div className="editor-toast pointer-events-auto absolute bottom-3 left-3 right-3 z-20 rounded-xl border border-emerald-400/20 bg-[#101820]/95 p-3 text-slate-200 shadow-2xl shadow-black/45 backdrop-blur-xl">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/12 text-emerald-300">
              <CheckCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white">Sitio aplicado</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{appliedTemplate.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndoReplace}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Deshacer
                </button>
                <button
                  type="button"
                  onClick={() => setAppliedTemplate(null)}
                  className="h-7 rounded-lg px-2 text-[11px] font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
                >
                  Ocultar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
