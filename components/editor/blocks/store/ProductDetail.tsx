"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ShoppingCart, Tag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { buildCartItemFromProductCardV1 } from "./product-card-binding";

/**
 * COMMERCE-6: the reusable dynamic product-detail block. Rendered ONLY by
 * the dynamic detail runtime (/p/<site>/producto/<id>, preview ?product=)
 * from a server-built tree whose props come straight from the
 * authoritative store row (lib/commerce/public-product-detail.ts). Shows
 * only those facts: name, image, description, variants, price, compare
 * price, stock state. Add to Cart goes through the same binding the
 * product card uses; checkout re-prices everything from the DB.
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
  variants?: VariantProps[];
  accentColor?: string;
  lowStockThreshold?: number;
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
  variants = [],
  accentColor = "#00b5f6",
  lowStockThreshold = 5,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const groupId = useId();
  const firstAvailable = variants.find((variant) => !isOutOfStock(variant.stock)) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.variantId);
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((variant) => variant.variantId === selectedId) ?? firstAvailable;
  if (!selected) return null;

  const outOfStock = isOutOfStock(selected.stock);
  const lowStock = !outOfStock && selected.stock !== -1 && selected.stock <= lowStockThreshold;
  const maxQuantity = selected.stock === -1 ? MAX_QUANTITY : Math.max(1, Math.min(MAX_QUANTITY, selected.stock));
  const safeQuantity = Math.min(Math.max(1, quantity), maxQuantity);
  const discount = selected.comparePriceMxn && selected.comparePriceMxn > selected.priceMxn
    ? Math.round((1 - selected.priceMxn / selected.comparePriceMxn) * 100)
    : null;

  const handleAdd = () => {
    const item = buildCartItemFromProductCardV1({
      productId,
      variantId: selected.variantId,
      productName,
      variantName: selected.label,
      priceMxn: selected.priceMxn,
      imageUrl,
      stock: selected.stock,
    });
    if (!item) return;
    addItem({ ...item, quantity: safeQuantity });
  };

  return (
    <article className="grid gap-10 lg:grid-cols-2 lg:items-start" data-store-product-detail>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {imageUrl
          ? <Image fill unoptimized src={imageUrl} alt={productName} className="object-cover" />
          : <div className="grid h-full w-full place-items-center text-slate-600"><Tag size={48} aria-hidden="true" /></div>}
        {discount && !outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-extrabold text-white">-{discount}%</span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">{productName}</h1>
          {description && <p className="text-base leading-relaxed text-slate-300 md:text-lg">{description}</p>}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold" style={{ color: accentColor }}>{formatMxn(selected.priceMxn)}</span>
          {selected.comparePriceMxn && selected.comparePriceMxn > selected.priceMxn && (
            <span className="text-base text-slate-500 line-through">{formatMxn(selected.comparePriceMxn)}</span>
          )}
        </div>

        {variants.length > 1 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-slate-200">Variante</legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const checked = variant.variantId === selected.variantId;
                const inputId = `${groupId}-${variant.variantId}`;
                return (
                  <label
                    key={variant.variantId}
                    htmlFor={inputId}
                    className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-white/60 ${checked ? "text-white" : "border-white/15 text-slate-300 hover:border-white/30"} ${isOutOfStock(variant.stock) ? "opacity-50" : ""}`}
                    style={checked ? { borderColor: accentColor, background: `${accentColor}33` } : undefined}
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
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <p className={`text-sm font-semibold ${outOfStock ? "text-slate-400" : lowStock ? "text-amber-400" : "text-emerald-400"}`} data-store-detail-stock={outOfStock ? "out-of-stock" : lowStock ? "low" : "available"}>
          {outOfStock ? "Sin stock" : lowStock ? `¡Solo quedan ${selected.stock} unidades!` : "Disponible"}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
            Cantidad
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQuantity}
              value={safeQuantity}
              disabled={outOfStock}
              onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10) || 1)}
              className="h-12 w-24 rounded-xl border border-white/15 bg-white/5 px-3 text-base text-white disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            data-store-card-state={outOfStock ? "out-of-stock" : "bound"}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: outOfStock ? "#374151" : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            {outOfStock ? "Sin stock" : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </article>
  );
}
