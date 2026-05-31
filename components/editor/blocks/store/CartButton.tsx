"use client";

import { useCartStore } from "@/store/useCartStore";
import { ShoppingCart } from "lucide-react";

interface Props {
  id?: string;
  accentColor?: string;
  label?: string;
}

export function CartButton({ accentColor = "#00b5f6", label = "Carrito" }: Props) {
  const toggle     = useCartStore((s) => s.toggle);
  const totalItems = useCartStore((s) => s.totalItems);

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
      style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
    >
      <ShoppingCart size={16} style={{ color: accentColor }} />
      {label}
      {totalItems() > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
          style={{ background: accentColor }}
        >
          {totalItems()}
        </span>
      )}
    </button>
  );
}
