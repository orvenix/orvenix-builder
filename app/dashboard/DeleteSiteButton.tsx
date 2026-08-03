"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteSiteAction, type DeleteSiteState } from "./actions";

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
}

const initialState: DeleteSiteState = {};

export function DeleteSiteButton({ siteId, siteName }: DeleteSiteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteSiteAction.bind(null, siteId),
    initialState
  );

  useEffect(() => {
    if (!state.ok) return;
    const timeout = window.setTimeout(() => {
      setOpen(false);
      router.refresh();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [router, state.ok]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title="Eliminar sitio"
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-white/20 transition-all hover:border-red-500/20 hover:bg-red-400/[0.08] hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-300/20 bg-[color:var(--bg)] p-6 text-[color:var(--text)] shadow-2xl shadow-black/55">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-red-300/20 bg-red-400/10 text-red-200">
                <AlertTriangle size={18} />
              </div>
              <div>
                <Dialog.Title className="text-base font-black text-white">
                  Eliminar sitio
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                  Vas a eliminar <span className="font-bold text-white">{siteName}</span>. Esta acción no se puede deshacer.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-white"
                disabled={isPending}
              >
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {state.error && !isPending && (
            <p className="mb-4 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-semibold leading-5 text-red-100">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isPending}
                className="flex h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 text-sm font-semibold text-[color:var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-400/15 px-4 text-sm font-black text-red-100 transition-colors hover:bg-red-400/22 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {isPending ? "Eliminando..." : "Eliminar definitivamente"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
