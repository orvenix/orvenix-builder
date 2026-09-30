"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CartItem } from "@/store/useCartStore";

/**
 * PCE-4B: truthful commerce feedback.
 *
 * `addItemWithResultV1` is the only producer of "added" feedback: it reads
 * the variant's quantity before and after the store's own `addItem`, so
 * feedback exists only when the cart really changed (store validation,
 * quantity cap and item cap stay authoritative). Successful local adds are
 * broadcast to cart-count badges through a tiny in-memory subscription, so
 * restoration from storage, multi-tab sync or unrelated re-renders never
 * trigger decorative count emphasis. Timing is Orvenix-owned.
 */

export const ADD_TO_CART_FEEDBACK_MS_V1 = 1800;

type CartStoreLike = {
  getState: () => { items: CartItem[]; addItem: (item: CartItem) => void };
};

export type AddToCartResultV1 = {
  added: boolean;
  productName: string;
  /** This variant's quantity in the cart after the add. */
  quantity: number;
};

function quantityOf(items: readonly CartItem[], variantId: string): number {
  return items.find((entry) => entry.variantId === variantId)?.quantity ?? 0;
}

const cartAddedListeners = new Set<() => void>();

export function subscribeCartAddedV1(listener: () => void): () => void {
  cartAddedListeners.add(listener);
  return () => {
    cartAddedListeners.delete(listener);
  };
}

function emitCartAddedV1() {
  for (const listener of [...cartAddedListeners]) listener();
}

export function addItemWithResultV1(store: CartStoreLike, item: CartItem): AddToCartResultV1 {
  const before = quantityOf(store.getState().items, item.variantId);
  store.getState().addItem(item);
  const after = quantityOf(store.getState().items, item.variantId);
  const added = after > before;
  if (added) emitCartAddedV1();
  return { added, productName: item.productName, quantity: after };
}

export function addToCartAnnouncementV1(result: AddToCartResultV1): string {
  return `${result.productName} añadido al carrito. Cantidad en el carrito: ${result.quantity}.`;
}

/** Button/live-region state for one add-to-cart control. */
export function useAddToCartFeedbackV1() {
  const [state, setState] = useState<{ added: boolean; message: string }>({ added: false, message: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const report = useCallback((result: AddToCartResultV1) => {
    if (!result.added) return;
    if (timer.current) clearTimeout(timer.current);
    setState({ added: true, message: addToCartAnnouncementV1(result) });
    timer.current = setTimeout(() => {
      timer.current = null;
      setState({ added: false, message: "" });
    }, ADD_TO_CART_FEEDBACK_MS_V1);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { ...state, report };
}

/**
 * Increments ONLY on a successful local add (never on hydration/restoration
 * or re-render). Use it as a React `key` so the badge replays one bounded
 * CSS emphasis; 0 means "never pulsed" (no animation class).
 */
export function useCartCountPulseV1(): number {
  const [pulse, setPulse] = useState(0);
  useEffect(() => subscribeCartAddedV1(() => setPulse((value) => value + 1)), []);
  return pulse;
}
