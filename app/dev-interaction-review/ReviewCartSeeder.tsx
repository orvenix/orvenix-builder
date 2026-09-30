"use client";

import { useEffect } from "react";
import { useCartStore, type CartItem } from "@/store/useCartStore";

/**
 * PCE-4B: DEV-ONLY. Loads a review cart preset into the in-memory cart.
 * Rendered AFTER the PublicRenderer so its effect runs after CartDrawer's
 * site-scope effect (which resets an unscoped cart). It writes state
 * directly -- never the store's add path -- so, exactly like storage
 * restoration, it must NOT trigger the add feedback or the count pulse.
 * Nothing is persisted (no /p/ site key).
 */
export function ReviewCartSeeder({ items }: { items: CartItem[] }) {
  const key = JSON.stringify(items);
  useEffect(() => {
    useCartStore.setState({ items: JSON.parse(key) as CartItem[] });
  }, [key]);
  return null;
}
