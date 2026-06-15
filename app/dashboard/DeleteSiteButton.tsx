'use client';

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteSiteAction, type DeleteSiteState } from "./actions";

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
}

const initialState: DeleteSiteState = {};

export function DeleteSiteButton({ siteId, siteName }: DeleteSiteButtonProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    deleteSiteAction.bind(null, siteId),
    initialState
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Eliminar "${siteName}"? Esta accion no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
      className="relative"
    >
      <button
        type="submit"
        title="Eliminar sitio"
        disabled={isPending}
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-white/20 transition-all hover:border-red-500/20 hover:bg-red-400/[0.08] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      </button>
      {state.error && !isPending && (
        <p className="absolute right-0 top-11 z-20 w-64 rounded-xl border border-red-300/15 bg-red-950/95 px-3 py-2 text-xs font-semibold leading-5 text-red-100 shadow-xl shadow-black/30">
          {state.error}
        </p>
      )}
    </form>
  );
}
