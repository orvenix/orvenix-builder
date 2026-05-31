"use client";

import { create } from "zustand";

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string;
  priceMxn: number;
  imageUrl?: string;
  quantity: number;
};

type CartState = {
  isOpen: boolean;
  items: CartItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  clear: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  totalItems: () => number;
  totalMxn: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  items: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  clear: () => set({ items: [], isOpen: false }),
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.variantId === item.variantId);
      if (!existing) {
        return { items: [...state.items, item], isOpen: true };
      }

      return {
        isOpen: true,
        items: state.items.map((entry) =>
          entry.variantId === item.variantId
            ? { ...entry, quantity: entry.quantity + Math.max(1, item.quantity) }
            : entry
        ),
      };
    }),
  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((item) => item.variantId !== variantId),
    })),
  updateQty: (variantId, quantity) =>
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((item) => item.variantId !== variantId)
        : state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
    })),
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalMxn: () => get().items.reduce((sum, item) => sum + item.priceMxn * item.quantity, 0),
}));
