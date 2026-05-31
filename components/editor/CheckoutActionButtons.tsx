"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, Loader2, Repeat, X } from "lucide-react";
import { useCheckoutRegistrationFlow } from "@/hooks/useCheckoutRegistrationFlow";

type ActionKey = "buy" | "rent";

export function CheckoutActionButtons() {
  const { startCheckout, isCheckingSession } = useCheckoutRegistrationFlow();
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (action: ActionKey) => {
    if (loading || isCheckingSession) return;
    setError(null);
    setLoading(action);
    try {
      await startCheckout({ action });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar el proceso. Intenta de nuevo.";
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const isDisabled = isCheckingSession || loading !== null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => void handleCheckout("buy")}
          className="motion-button flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading === "buy" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {loading === "buy" ? "Procesando..." : "Comprar"}
        </button>

        <button
          type="button"
          disabled={isDisabled}
          onClick={() => void handleCheckout("rent")}
          className="motion-button flex h-9 items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/15 disabled:opacity-50"
        >
          {loading === "rent" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Repeat className="h-4 w-4" />
          )}
          {loading === "rent" ? "Procesando..." : "Rentar"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-[11px] text-red-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="min-w-0 wrap-break-word">{error}</span>
          <button
            type="button"
            aria-label="Cerrar error"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 text-red-400/60 hover:text-red-300"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
