"use client";

import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingCart, Tag } from "lucide-react";

interface Props {
  id?: string;
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  priceMxn?: number;
  comparePriceMxn?: number;
  imageUrl?: string;
  badge?: string;
  accentColor?: string;
  stock?: number;           // -1 = unlimited
  lowStockThreshold?: number;
}

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function ProductCard({
  productId     = "demo",
  variantId     = "demo-v1",
  productName   = "Producto de ejemplo",
  variantName   = "Talla única",
  priceMxn      = 29900,
  comparePriceMxn,
  imageUrl,
  badge,
  accentColor   = "#00b5f6",
  stock         = -1,
  lowStockThreshold = 5,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = stock !== -1 && stock <= 0;
  const isLowStock   = stock !== -1 && stock > 0 && stock <= lowStockThreshold;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({ variantId, productId, productName, variantName, priceMxn, imageUrl, quantity: 1 });
  };

  const discount = comparePriceMxn && comparePriceMxn > priceMxn
    ? Math.round((1 - priceMxn / comparePriceMxn) * 100)
    : null;

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 bg-white/2 hover:border-white/[0.14] transition-all duration-300">

      {/* Imagen */}
      <div className="relative aspect-square bg-white/4 overflow-hidden">
        {imageUrl
          ? <Image fill unoptimized src={imageUrl} alt={productName ?? ""} className="object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full grid place-items-center text-slate-700"><Tag size={32} /></div>
        }
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
            style={{ background: accentColor }}>
            {badge}
          </span>
        )}
        {discount && !isOutOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 text-slate-400 border border-white/10">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-sm font-semibold text-white mb-1 line-clamp-2">{productName}</p>
        <p className="text-xs text-slate-600 mb-1">{variantName}</p>
        {isLowStock && (
          <p className="text-[10px] text-amber-400 font-semibold mb-2">
            ¡Solo quedan {stock} unidades!
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold" style={{ color: accentColor }}>
              {formatMxn(priceMxn)}
            </span>
            {comparePriceMxn && comparePriceMxn > priceMxn && (
              <span className="text-xs text-slate-600 line-through">{formatMxn(comparePriceMxn)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: isOutOfStock ? "#374151" : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
          >
            <ShoppingCart size={14} />
            {isOutOfStock ? "Sin stock" : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}
