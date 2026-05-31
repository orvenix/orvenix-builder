"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { createSiteAction } from "./actions";

interface CreateSiteDialogProps {
  trigger?: React.ReactNode;
  triggerVariant?: "default" | "card";
}

export function CreateSiteDialog({ trigger, triggerVariant = "default" }: CreateSiteDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSiteAction(formData);
      if (result?.error) { setError(result.error); return; }
      setOpen(false);
      if (result?.ok && result.id) router.push(`/editor/${result.id}`);
    });
  };

  const defaultTrigger = (
    <button
      type="button"
      className="relative flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #00b5f6 0%, #0083b3 100%)",
        boxShadow: "0 18px 42px rgba(0,131,179,0.22), 0 0 0 1px rgba(0,181,246,0.18)",
      }}
    >
      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-[100%]" />
      <Plus size={14} className="relative z-10" />
      <span className="relative z-10">Nuevo sitio</span>
    </button>
  );

  const cardTrigger = (
    <button
      type="button"
      className="group flex flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[rgba(0,181,246,0.16)] bg-[color:var(--bg)]/60 p-8 text-center transition-all hover:-translate-y-0.5 hover:border-[rgba(0,181,246,0.30)] hover:bg-[rgba(0,181,246,0.05)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(0,181,246,0.24)] bg-[rgba(0,181,246,0.10)] transition-transform group-hover:scale-110">
        <Plus size={18} className="text-[color:var(--accent)]" />
      </div>
      <div>
        <div className="text-sm font-semibold text-[color:var(--text-secondary)] transition-colors group-hover:text-[color:var(--accent)]">Nuevo sitio guardado</div>
        <div className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">Crear y abrir editor</div>
      </div>
    </button>
  );

  const resolvedTrigger = trigger ?? (triggerVariant === "card" ? cardTrigger : defaultTrigger);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {resolvedTrigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md editor-anim-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[26px] border border-white/[0.1] bg-[color:var(--bg)] p-7 shadow-2xl shadow-black/45 editor-anim-scale-in"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,181,246,0.50)] to-transparent" />
          {/* Header */}
          <div className="relative mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(0,181,246,0.22)] bg-[rgba(0,181,246,0.10)]">
                <Sparkles size={15} className="text-[color:var(--accent)]" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold leading-tight text-[color:var(--text)]">
                  Nuevo sitio
                </Dialog.Title>
                <p className="mt-0.5 text-[11px] text-[color:var(--text-secondary)]">Abre el editor al instante</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--text)]"
              >
                <X size={13} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">
                Nombre del sitio *
              </label>
              <input
                name="name"
                type="text"
                required
                autoFocus
                placeholder="Mi Landing Page"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-[color:var(--text)] transition-all placeholder:text-[color:var(--text-muted)] focus:border-[rgba(0,181,246,0.45)] focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,181,246,0.08)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">
                Descripción <span className="normal-case text-[color:var(--text-muted)]">(opcional)</span>
              </label>
              <input
                name="description"
                type="text"
                placeholder="Para qué es este sitio"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-[color:var(--text)] transition-all placeholder:text-[color:var(--text-muted)] focus:border-[rgba(0,181,246,0.45)] focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_4px_rgba(0,181,246,0.08)]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 editor-anim-fade-up">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-2xl border border-white/[0.08] text-sm text-[color:var(--text-secondary)] transition-all hover:bg-white/[0.04] hover:text-[color:var(--text)]"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="relative flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #00b5f6 0%, #0083b3 100%)",
                  boxShadow: "0 14px 34px rgba(0,131,179,0.20)",
                }}
              >
                <span className="absolute inset-0 editor-publish-shimmer opacity-0 hover:opacity-100 transition-opacity" />
                {isPending && <Loader2 size={13} className="animate-spin relative z-10" />}
                <span className="relative z-10">{isPending ? "Creando…" : "Crear y abrir editor"}</span>
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
