"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { buildCartItemFromProductCardV1 } from "./product-card-binding";
import { addItemWithResultV1, useAddToCartFeedbackV1 } from "./cart-feedback";
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media";
import {
  LEGACY_DARK_COMMERCE_SURFACE_V1,
  mixHexV1,
  productMonogramV1,
  sanitizeCommerceSurfaceV1,
  type CommerceSurfaceV1,
} from "@/lib/orvenix-ai/commerce/commerce-surface";

/**
 * COMMERCE-6: the reusable dynamic product-detail block. Rendered ONLY by
 * the dynamic detail runtime (/p/<site>/producto/<id>, preview ?product=)
 * from a server-built tree whose props come straight from the
 * authoritative store row (lib/commerce/public-product-detail.ts). Shows
 * only those facts: name, image, description, variants, price, compare
 * price, stock state. Add to Cart goes through the same binding the
 * product card uses; checkout re-prices everything from the DB.
 *
 * PCE-2: colors come from the Orvenix-computed theme surface; with no
 * authoritative image the layout reflows to one column with a compact,
 * honest monogram instead of a large empty media square. `imageUrls` is
 * kept for the future gallery; only the primary image renders today.
 */

interface VariantProps {
  variantId: string;
  label: string;
  priceMxn: number;
  comparePriceMxn?: number;
  stock: number;
}

interface Props {
  productId?: string;
  productName?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  variants?: VariantProps[];
  accentColor?: string;
  lowStockThreshold?: number;
  surface?: CommerceSurfaceV1;
}

const MAX_QUANTITY = 99;

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

function isOutOfStock(stock: number) {
  return stock !== -1 && stock <= 0;
}

export function ProductDetail({
  productId,
  productName = "Producto",
  description,
  imageUrl,
  imageUrls,
  variants = [],
  accentColor = "#00b5f6",
  lowStockThreshold = 5,
  surface: rawSurface,
}: Props) {
  const feedback = useAddToCartFeedbackV1();
  const groupId = useId();
  const firstAvailable = variants.find((variant) => !isOutOfStock(variant.stock)) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.variantId);
  const [quantity, setQuantity] = useState(1);

  const themed = sanitizeCommerceSurfaceV1(rawSurface);
  const surface = themed ?? { ...LEGACY_DARK_COMMERCE_SURFACE_V1, accent: accentColor };
  const primaryImage = [imageUrl, ...(imageUrls ?? [])].find(isSafeProductMediaUrlV1)?.trim() ?? null;

  const selected = variants.find((variant) => variant.variantId === selectedId) ?? firstAvailable;
  if (!selected) return null;

  const outOfStock = isOutOfStock(selected.stock);
  const lowStock = !outOfStock && selected.stock !== -1 && selected.stock <= lowStockThreshold;
  const maxQuantity = selected.stock === -1 ? MAX_QUANTITY : Math.max(1, Math.min(MAX_QUANTITY, selected.stock));
  const safeQuantity = Math.min(Math.max(1, quantity), maxQuantity);
  const discount = selected.comparePriceMxn && selected.comparePriceMxn > selected.priceMxn
    ? Math.round((1 - selected.priceMxn / selected.comparePriceMxn) * 100)
    : null;
  const tileBackground = mixHexV1(surface.accent, surface.card, surface.tone === "light" ? 0.9 : 0.82);

  const handleAdd = () => {
    const item = buildCartItemFromProductCardV1({
      productId,
      variantId: selected.variantId,
      productName,
      variantName: selected.label,
      priceMxn: selected.priceMxn,
      imageUrl: primaryImage ?? undefined,
      stock: selected.stock,
    });
    if (!item) return;
    // PCE-4B: feedback only after the store really added it.
    feedback.report(addItemWithResultV1(useCartStore, { ...item, quantity: safeQuantity }));
  };

  const info = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {!primaryImage && (
          <span
            className="grid h-20 w-20 place-items-center rounded-2xl text-2xl font-black"
            style={{ background: tileBackground, color: surface.accent }}
            data-store-media="fallback"
            aria-hidden="true"
          >
            {productMonogramV1(productName)}
          </span>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl" style={{ color: surface.heading }}>{productName}</h1>
        {description && <p className="text-base leading-relaxed md:text-lg" style={{ color: surface.body }}>{description}</p>}
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-extrabold" style={{ color: surface.accent }}>{formatMxn(selected.priceMxn)}</span>
        {selected.comparePriceMxn && selected.comparePriceMxn > selected.priceMxn && (
          <span className="text-base line-through" style={{ color: surface.muted }}>{formatMxn(selected.comparePriceMxn)}</span>
        )}
        {discount && !outOfStock && (
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-extrabold text-white">-{discount}%</span>
        )}
      </div>

      {variants.length > 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-semibold" style={{ color: surface.heading }}>Variante</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const checked = variant.variantId === selected.variantId;
              const unavailable = isOutOfStock(variant.stock);
              const inputId = `${groupId}-${variant.variantId}`;
              // PCE-4B: selected is unmistakable without motion (accent border +
              // inset accent ring + tint); keyboard focus gets its own outline;
              // unavailability comes only from the authoritative stock.
              return (
                <label
                  key={variant.variantId}
                  htmlFor={inputId}
                  data-variant-state={checked ? "selected" : unavailable ? "unavailable" : "available"}
                  className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-[var(--orv-interaction-duration,300ms)] [border-color:var(--orv-variant-border)] hover:[border-color:var(--orv-variant-accent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:[outline-style:solid] has-[:focus-visible]:[outline-color:var(--orv-variant-accent)] ${unavailable ? "opacity-50 line-through" : ""}`}
                  style={{
                    "--orv-variant-accent": surface.accent,
                    "--orv-variant-border": checked ? surface.accent : surface.border,
                    ...(checked
                      ? { background: mixHexV1(surface.accent, surface.card, 0.85), color: surface.heading, boxShadow: `inset 0 0 0 1px ${surface.accent}` }
                      : { color: surface.body }),
                  } as React.CSSProperties & Record<"--orv-variant-accent" | "--orv-variant-border", string>}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={groupId}
                    value={variant.variantId}
                    checked={checked}
                    onChange={() => { setSelectedId(variant.variantId); setQuantity(1); }}
                    className="sr-only"
                  />
                  {variant.label}
                  {unavailable && <span className="sr-only"> (sin stock)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`text-sm font-semibold ${outOfStock ? "" : lowStock ? "text-amber-600" : "text-emerald-600"}`} style={outOfStock ? { color: surface.muted } : undefined} data-store-detail-stock={outOfStock ? "out-of-stock" : lowStock ? "low" : "available"}>
        {outOfStock ? "Sin stock" : lowStock ? `¡Solo quedan ${selected.stock} unidades!` : "Disponible"}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-2 text-sm font-semibold" style={{ color: surface.heading }}>
          Cantidad
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxQuantity}
            value={safeQuantity}
            disabled={outOfStock}
            onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10) || 1)}
            className="h-12 w-24 rounded-xl border px-3 text-base disabled:opacity-50"
            style={{ borderColor: surface.border, background: surface.card, color: surface.heading }}
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          data-store-card-state={outOfStock ? "out-of-stock" : "bound"}
          data-cart-feedback={feedback.added ? "added" : undefined}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={outOfStock ? { background: surface.border, color: surface.muted } : { background: surface.accent, color: surface.onAccent }}
        >
          <ShoppingCart size={18} aria-hidden="true" />
          {outOfStock ? "Sin stock" : feedback.added ? <>Añadido <span aria-hidden="true">✓</span></> : "Añadir al carrito"}
        </button>
        <span className="sr-only" role="status" aria-live="polite">{feedback.message}</span>
      </div>
    </div>
  );

  if (!primaryImage) {
    return (
      <article className="mx-auto w-full max-w-3xl rounded-3xl border p-6 md:p-10" style={{ background: surface.card, borderColor: surface.border }} data-store-product-detail data-store-surface={themed ? surface.tone : "legacy"}>
        {info}
      </article>
    );
  }

  return (
    <article className="grid gap-10 lg:grid-cols-2 lg:items-start" data-store-product-detail data-store-surface={themed ? surface.tone : "legacy"}>
      <div className="relative aspect-square overflow-hidden rounded-3xl border" style={{ background: tileBackground, borderColor: surface.border }}>
        <Image fill unoptimized src={primaryImage} alt={productName} className="object-cover" data-store-media="image" />
      </div>
      {info}
    </article>
  );
}
