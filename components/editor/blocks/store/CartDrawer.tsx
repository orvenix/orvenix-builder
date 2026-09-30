"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useEditorStore } from "@/store/useEditorStore";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import {
  getFocusableElements,
  isEscapeKey,
  lockBodyScroll,
  resolveFocusTrapTarget,
  restoreFocus,
} from "@/lib/builder-core/runtime/interaction";

interface Props {
  id?: string;
  siteId?: string;
  accentColor?: string;
  checkoutLabel?: string;
  funnelId?: string;
  funnelStep?: "landing" | "checkout" | "upsell" | "downsell" | "thankyou";
}

/** PCE-4A: fallback return target when the opener did not keep focus (e.g. Safari click). */
function findVisibleCartTrigger(): HTMLElement | null {
  const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-trigger]"));
  return triggers.find((element) => element.getClientRects().length > 0) ?? null;
}

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function CartDrawer({
  siteId,
  accentColor = "#00b5f6",
  checkoutLabel = "Ir a pagar",
  funnelId,
  funnelStep = "checkout",
}: Props) {
  const isOpen    = useCartStore((s) => s.isOpen);
  const items     = useCartStore((s) => s.items);
  const close     = useCartStore((s) => s.close);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty  = useCartStore((s) => s.updateQty);
  const clear      = useCartStore((s) => s.clear);
  const totalMxn   = useCartStore((s) => s.totalMxn);
  const totalItems = useCartStore((s) => s.totalItems);
  const setCartSite = useCartStore((s) => s.setSite);
  const syncCartFromStorage = useCartStore((s) => s.syncFromStorage);
  const storageKey = useCartStore((s) => s.storageKey);
  // Fallback to the editor store's websiteId (available in both edit and public preview mode)
  const storeSiteId = useEditorStore((s) => s.websiteId);
  const pathname = usePathname();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const drawerId = useId();
  const titleId = `${drawerId}-title`;
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const resolvedPersistenceSiteId = pathname?.startsWith("/p/") ? (siteId || storeSiteId) : null;

  useEffect(() => {
    setCartSite(resolvedPersistenceSiteId);
  }, [resolvedPersistenceSiteId, setCartSite]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) syncCartFromStorage();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey, syncCartFromStorage]);

  // PCE-4A: modal dialog behavior. Owns ONLY focus/keyboard/scroll -- the
  // cart persistence effects above (Cart Continuity V1) are untouched.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        const active = document.activeElement;
        const focusWasInDrawer = !active || active === document.body || Boolean(drawerRef.current?.contains(active));
        if (focusWasInDrawer) restoreFocus(triggerRef.current);
        triggerRef.current = null;
      }
      return;
    }

    wasOpenRef.current = true;
    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement && active !== document.body && !drawerRef.current?.contains(active)
      ? active
      : findVisibleCartTrigger();
    const releaseScrollLock = lockBodyScroll(document.body);
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isEscapeKey(event)) {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const target = resolveFocusTrapTarget({
        focusables: getFocusableElements<HTMLElement>(container),
        active: document.activeElement,
        shiftKey: event.shiftKey,
        activeInside: container.contains(document.activeElement),
      });
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      releaseScrollLock();
    };
  }, [isOpen, close]);

  const handleCheckout = async () => {
    if (items.length === 0 || isCheckingOut) return;
    setCheckoutError(null);

    const resolvedSiteId = siteId || storeSiteId;
    if (!resolvedSiteId) {
      setCheckoutError("Configura el sitio antes de usar el checkout.");
      return;
    }
    if (!customerEmail.trim()) {
      setCheckoutError("Escribe tu email para continuar.");
      return;
    }

    setIsCheckingOut(true);
    const currentUrl = typeof window !== "undefined" ? new URL(window.location.href) : null;
    const experimentId = currentUrl?.searchParams.get("experimentId")?.trim() || undefined;
    const experimentVariantRaw = currentUrl?.searchParams.get("experimentVariant");
    const experimentVariant = experimentId && (experimentVariantRaw === "A" || experimentVariantRaw === "B")
      ? experimentVariantRaw
      : undefined;
    const res = await fetch(`/api/store/${encodeURIComponent(resolvedSiteId)}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail,
        customerName,
        funnelId: funnelId?.trim() || undefined,
        funnelStep: funnelId?.trim() ? funnelStep : undefined,
        experimentId,
        experimentVariant,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      }),
    });
    const payload = await res.json() as { redirectUrl?: string; message?: string; error?: string };
    setIsCheckingOut(false);

    if (!res.ok) {
      setCheckoutError(payload.message ?? payload.error ?? "No se pudo iniciar el checkout.");
      return;
    }

    if (payload.redirectUrl) {
      clear();
      window.location.href = payload.redirectUrl;
    }
  };

  return (
    <>
      {/* Overlay -- always mounted so it can fade; inert/hidden while closed. */}
      <div
        className="orvenix-cart-overlay fixed inset-0 bg-black/50 z-40"
        data-state={isOpen ? "open" : "closed"}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        id={drawerId}
        role="dialog"
        aria-modal={isOpen ? true : undefined}
        aria-labelledby={titleId}
        aria-hidden={isOpen ? undefined : true}
        inert={!isOpen}
        data-state={isOpen ? "open" : "closed"}
        className="orvenix-cart-drawer fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl"
        style={{ background: "#0a1628", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: accentColor }} />
            <span id={titleId} className="text-base font-bold text-white">Carrito</span>
            {totalItems() > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: accentColor }}>
                {totalItems()}
              </span>
            )}
          </div>
          <button type="button" ref={closeButtonRef} onClick={close}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors"
            aria-label="Cerrar carrito">
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <ShoppingCart size={36} className="text-slate-700" />
              <p className="text-sm text-slate-500">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId}
                className="flex gap-3 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>

                {item.imageUrl && (
                  <Image unoptimized width={56} height={56} src={item.imageUrl} alt={item.productName}
                    className="rounded-lg object-cover shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.productName}</p>
                  <p className="text-xs text-slate-500 mb-2">{item.variantName}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQty(item.variantId, item.quantity - 1)}
                        aria-label={`Disminuir cantidad de ${item.productName}`}
                        className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.variantId, item.quantity + 1)}
                        aria-label={`Aumentar cantidad de ${item.productName}`}
                        className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {formatMxn(item.priceMxn * item.quantity)}
                      </span>
                      <button type="button" onClick={() => removeItem(item.variantId)}
                        aria-label={`Quitar ${item.productName} del carrito`}
                        className="grid h-6 w-6 place-items-center rounded text-slate-700 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-white/[0.07]"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="mb-3 space-y-2">
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="Email para tu pedido"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/20"
              />
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nombre (opcional)"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/20"
              />
              {checkoutError && (
                <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {checkoutError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-xl font-extrabold text-white">{formatMxn(totalMxn())}</span>
            </div>
           <div className="space-y-2">
  <button
    type="button"
    onClick={handleCheckout}
    disabled={isCheckingOut}
    aria-busy={isCheckingOut || undefined}
    className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628] disabled:cursor-not-allowed disabled:opacity-60"
    style={{
      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
    }}
  >
    {isCheckingOut
      ? "Preparando pago..."
      : `${checkoutLabel} con Mercado Pago`}
  </button>

  <p className="text-center text-[11px] leading-relaxed text-slate-500">
    Pago seguro mediante Mercado Pago. Podrás elegir los métodos disponibles
    antes de completar tu compra.
  </p>
</div>
          </div>
        )}
      </aside>
    </>
  );
}
