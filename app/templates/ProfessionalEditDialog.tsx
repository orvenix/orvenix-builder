"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Loader2, Send, Wrench, X } from "lucide-react";
import {
  requestProfessionalEditAction,
  type ProfessionalEditState,
} from "./actions";

interface ProfessionalEditDialogProps {
  templateId: string;
  templateName: string;
  accent?: string;
  compact?: boolean;
}

const initialState: ProfessionalEditState = {};

export function ProfessionalEditDialog({
  templateId,
  templateName,
  accent = "#6366f1",
  compact = false,
}: ProfessionalEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    requestProfessionalEditAction,
    initialState
  );

  useEffect(() => {
    if (state.ok) {
      const timeout = window.setTimeout(() => setOpen(false), 1800);
      return () => window.clearTimeout(timeout);
    }
  }, [state.ok]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={
            compact
              ? "motion-button flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
              : "motion-button flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.08] px-3 text-sm font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.12]"
          }
        >
          <Wrench size={compact ? 14 : 15} style={{ color: accent }} />
          Solicitar ajustes a experto
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-[#0d1117] p-6 text-white shadow-2xl shadow-black/50">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Solicitar ajustes a experto
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-slate-500">
                Envía textos, fotos, secciones o instrucciones para que nuestro equipo modifique {templateName} manualmente en tu cuenta.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {state.ok ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 size={16} />
                Ticket generado
              </div>
              <p className="mt-1 text-xs text-emerald-100/70">
                Ticket #{state.ticketId}. Quedó asignado al equipo proveedor para edición manual.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="templateId" value={templateId} />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Cambios solicitados *
                </label>
                <textarea
                  name="brief"
                  required
                  rows={5}
                  placeholder="Ej: Cambiar textos del hero, reemplazar fotos, agregar sección de testimonios, ajustar precios..."
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Fotos o recursos
                  </label>
                  <input
                    name="assets"
                    placeholder="Links Drive, URLs, logo..."
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Plazo deseado
                  </label>
                  <input
                    name="timeline"
                    placeholder="Esta semana"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {state.error && (
                <p className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="motion-button flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {isPending ? "Generando ticket..." : "Generar ticket de soporte"}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
