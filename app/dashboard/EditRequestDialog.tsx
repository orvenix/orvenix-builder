"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, CheckCircle2, Loader2, Send, Wrench, X } from "lucide-react";
import {
  createSiteEditRequestAction,
  type SiteEditRequestState,
} from "./actions";

interface EditRequestDialogProps {
  siteId: string;
  siteName: string;
  accent?: string;
}

const initialState: SiteEditRequestState = {};

export function EditRequestDialog({
  siteId,
  siteName,
  accent = "#38bdf8",
}: EditRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createSiteEditRequestAction,
    initialState
  );

  useEffect(() => {
    if (!state.ok) return;
    const timeout = window.setTimeout(() => setOpen(false), 1700);
    return () => window.clearTimeout(timeout);
  }, [state.ok]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Solicitar ajuste profesional"
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-[color:var(--text-muted)] transition-all hover:border-[rgba(0,181,246,0.20)] hover:bg-[rgba(0,181,246,0.08)] hover:text-[color:var(--accent)]"
        >
          <Wrench size={12} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-[color:var(--bg)] p-6 text-[color:var(--text)] shadow-2xl shadow-black/50">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Solicitar ajuste profesional
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
                Crea un ticket DIFM para que el equipo trabaje cambios manuales en {siteName}.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--text)]"
              >
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {state.ok ? (
            <div className="rounded-xl border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
                <CheckCircle2 size={16} />
                Solicitud enviada
              </div>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                Ticket #{state.ticketId}. Ya aparece en el panel de solicitudes.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="siteId" value={siteId} />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                  Cambios solicitados *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Ej: Cambiar el hero, ajustar colores, reemplazar fotos, agregar una sección de reseñas..."
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-[color:var(--text)] outline-none transition-colors placeholder:text-[color:var(--text-muted)] focus:border-[rgba(0,181,246,0.50)]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                    Recursos
                  </label>
                  <input
                    name="assets"
                    placeholder="Links, Drive..."
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(0,181,246,0.50)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                    Plazo
                  </label>
                  <input
                    name="timeline"
                    placeholder="Esta semana"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(0,181,246,0.50)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-secondary)]">
                    Prioridad
                  </label>
                  <select
                    name="priority"
                    defaultValue="normal"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-[color:var(--bg-2)] px-3 text-sm text-[color:var(--text)] outline-none focus:border-[rgba(0,181,246,0.50)]"
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              {state.error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="motion-button flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${accent}, #0083b3)`,
                  boxShadow: `0 14px 34px ${accent}22`,
                }}
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {isPending ? "Creando solicitud..." : "Crear solicitud DIFM"}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
