"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicCartOfferSummary } from "@/lib/commerce/funnel-offer-public";
import { useCartStore } from "@/store/useCartStore";
import { useEditorStore } from "@/store/useEditorStore";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";

interface Props {
  id?: string;
  siteId?: string;
  accentColor?: string;
  checkoutLabel?: string;
  funnelId?: string;
  funnelStep?: "landing" | "checkout" | "upsell" | "downsell" | "thankyou";
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
  const searchParams = useSearchParams();
  const isOpen    = useCartStore((s) => s.isOpen);
  const items     = useCartStore((s) => s.items);
  const close     = useCartStore((s) => s.close);
  const open      = useCartStore((s) => s.open);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty  = useCartStore((s) => s.updateQty);
  const clear      = useCartStore((s) => s.clear);
  const totalMxn   = useCartStore((s) => s.totalMxn);
  const totalItems = useCartStore((s) => s.totalItems);
  // Fallback to the editor store's websiteId (available in both edit and public preview mode)
  const storeSiteId = useEditorStore((s) => s.websiteId);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(true);

  const activeFunnelId = searchParams.get("funnelId")?.trim() || funnelId?.trim() || "";
  const activeFunnelStepRaw = searchParams.get("funnelStep")?.trim() || funnelStep;
  const activeFunnelStep = (
    activeFunnelStepRaw === "landing"
    || activeFunnelStepRaw === "checkout"
    || activeFunnelStepRaw === "upsell"
    || activeFunnelStepRaw === "downsell"
    || activeFunnelStepRaw === "thankyou"
  ) ? activeFunnelStepRaw : "checkout";
  const activeFunnelStepId = searchParams.get("funnelStepId")?.trim() || "";
  const cartRequested = searchParams.get("cart") === "open";
  const canAcceptOffer = Boolean(
    activeFunnelId
    && activeFunnelStepId
    && (activeFunnelStep === "checkout" || activeFunnelStep === "upsell" || activeFunnelStep === "downsell")
  );
  const activeOfferSummary = getPublicCartOfferSummary({
    stepKind: canAcceptOffer ? activeFunnelStep : null,
    offerAccepted,
    offerType: searchParams.get("offerType")?.trim() || null,
    offerLabel: searchParams.get("offerLabel")?.trim() || null,
    offerValue: searchParams.get("offerValue")?.trim() || null,
    offerDiscountPercent: searchParams.get("offerDiscountPercent")?.trim() || null,
    offerDiscountFixed: searchParams.get("offerDiscountFixed")?.trim() || null,
    offerPriceMxn: searchParams.get("offerPriceMxn")?.trim() || null,
    totalMxn: totalMxn(),
  });
  const cartTotalMxn = totalMxn();

  useEffect(() => {
    if (cartRequested && !isOpen) {
      open();
    }
  }, [cartRequested, isOpen, open]);

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
        funnelId: activeFunnelId || undefined,
        funnelStep: activeFunnelId ? activeFunnelStep : undefined,
        funnelStepId: activeFunnelStepId || undefined,
        offerAccepted: canAcceptOffer ? offerAccepted : undefined,
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
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#0a1628", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: accentColor }} />
            <span className="text-base font-bold text-white">Carrito</span>
            {totalItems() > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: accentColor }}>
                {totalItems()}
              </span>
            )}
          </div>
          <button type="button" onClick={close}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors">
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
                        className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-slate-400 transition-colors">
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.variantId, item.quantity + 1)}
                        className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-slate-400 transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {formatMxn(item.priceMxn * item.quantity)}
                      </span>
                      <button type="button" onClick={() => removeItem(item.variantId)}
                        className="grid h-6 w-6 place-items-center rounded text-slate-700 hover:text-red-400 transition-colors">
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
              {activeOfferSummary && (
                <div className={`rounded-xl border px-3 py-3 text-xs ${
                  activeOfferSummary.tone === "cyan"
                    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                    : activeOfferSummary.tone === "emerald"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : "border-amber-400/20 bg-amber-500/10 text-amber-100"
                }`}>
                  <p className="font-semibold">{activeOfferSummary.title}</p>
                  <p className="mt-1 opacity-90">{activeOfferSummary.description}</p>
                  {activeOfferSummary.estimatedLabel && activeOfferSummary.estimatedValue && (
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] font-medium">
                      <span className="opacity-80">{activeOfferSummary.estimatedLabel}</span>
                      <span>{activeOfferSummary.estimatedValue}</span>
                    </div>
                  )}
                  {activeOfferSummary.finePrint && (
                    <p className="mt-2 text-[11px] opacity-75">
                      {activeOfferSummary.finePrint}
                    </p>
                  )}
                </div>
              )}
              {canAcceptOffer && (
                <label className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                  <input
                    type="checkbox"
                    checked={offerAccepted}
                    onChange={(event) => setOfferAccepted(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/5"
                  />
                  <span>{activeOfferSummary?.checkboxLabel ?? "Aplicar la oferta activa de este paso al iniciar el pago."}</span>
                </label>
              )}
            </div>
            {activeOfferSummary?.estimatedLabel && activeOfferSummary?.estimatedValue && activeOfferSummary?.estimatedTotalLabel && activeOfferSummary?.estimatedTotalValue ? (
              <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatMxn(cartTotalMxn)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{activeOfferSummary.estimatedLabel}</span>
                  <span className={activeOfferSummary.tone === "amber" ? "text-amber-300" : "text-emerald-300"}>
                    {activeOfferSummary.tone === "amber" ? "+" : "-"}{activeOfferSummary.estimatedValue}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-sm text-slate-300">{activeOfferSummary.estimatedTotalLabel}</span>
                  <span className="text-xl font-extrabold text-white">{activeOfferSummary.estimatedTotalValue}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-xl font-extrabold text-white">{formatMxn(cartTotalMxn)}</span>
              </div>
            )}
            <button type="button" onClick={handleCheckout} disabled={isCheckingOut}
              className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
              {isCheckingOut ? "Preparando pago..." : checkoutLabel}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
