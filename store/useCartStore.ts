"use client";

import { create } from "zustand";

export const CART_STORAGE_VERSION_V1 = 1;
export const CART_MAX_ITEM_QUANTITY_V1 = 99;
export const CART_MAX_ITEMS_V1 = 50;

const CART_STORAGE_PREFIX_V1 = "orvenix_store_cart";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,191}$/;

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string;
  priceMxn: number;
  imageUrl?: string;
  quantity: number;
};

type PersistedCartPayloadV1 = {
  version: typeof CART_STORAGE_VERSION_V1;
  siteId: string;
  items: CartItem[];
};

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type CartState = {
  isOpen: boolean;
  siteId: string | null;
  storageKey: string | null;
  isHydrated: boolean;
  items: CartItem[];
  setSite: (siteId: string | null | undefined) => void;
  syncFromStorage: () => void;
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

function getStorage(): BrowserStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : globalThis.localStorage;
  } catch {
    return null;
  }
}

function normalizeCartSiteId(siteId: string | null | undefined): string | null {
  if (typeof siteId !== "string") return null;
  const normalized = siteId.trim();
  if (!ID_PATTERN.test(normalized)) return null;
  return normalized;
}

export function getCartStorageKeyV1(siteId: string | null | undefined): string | null {
  const normalized = normalizeCartSiteId(siteId);
  return normalized ? `${CART_STORAGE_PREFIX_V1}:v${CART_STORAGE_VERSION_V1}:${normalized}` : null;
}

function boundedText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 191) : fallback;
}

function sanitizeQuantity(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > CART_MAX_ITEM_QUANTITY_V1) return null;
  return value;
}

function sanitizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.variantId !== "string" || !ID_PATTERN.test(candidate.variantId)) return null;
  if (typeof candidate.productId !== "string" || !ID_PATTERN.test(candidate.productId)) return null;
  if (typeof candidate.priceMxn !== "number" || !Number.isInteger(candidate.priceMxn) || candidate.priceMxn < 0 || candidate.priceMxn > 1_000_000_000) return null;
  const quantity = sanitizeQuantity(candidate.quantity);
  if (quantity === null) return null;

  return {
    variantId: candidate.variantId,
    productId: candidate.productId,
    productName: boundedText(candidate.productName, "Producto"),
    ...(typeof candidate.variantName === "string" && candidate.variantName.trim()
      ? { variantName: candidate.variantName.trim().slice(0, 191) }
      : {}),
    priceMxn: candidate.priceMxn,
    ...(typeof candidate.imageUrl === "string" && candidate.imageUrl.trim()
      ? { imageUrl: candidate.imageUrl.trim().slice(0, 2048) }
      : {}),
    quantity,
  };
}

export function parsePersistedCartPayloadV1(raw: string, expectedSiteId: string): CartItem[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const payload = parsed as Partial<PersistedCartPayloadV1>;
  if (payload.version !== CART_STORAGE_VERSION_V1) return null;
  if (payload.siteId !== expectedSiteId) return null;
  if (!Array.isArray(payload.items) || payload.items.length > CART_MAX_ITEMS_V1) return null;

  const items: CartItem[] = [];
  const seen = new Set<string>();
  for (const item of payload.items) {
    const sanitized = sanitizeCartItem(item);
    if (!sanitized || seen.has(sanitized.variantId)) return null;
    seen.add(sanitized.variantId);
    items.push(sanitized);
  }
  return items;
}

function readPersistedCart(siteId: string, storage = getStorage()): CartItem[] {
  const key = getCartStorageKeyV1(siteId);
  if (!key || !storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const items = parsePersistedCartPayloadV1(raw, siteId);
    if (items) return items;
    storage.removeItem(key);
    return [];
  } catch {
    return [];
  }
}

function persistCart(siteId: string | null, items: readonly CartItem[], storage = getStorage()) {
  const key = getCartStorageKeyV1(siteId);
  if (!key || !siteId || !storage) return;
  try {
    if (items.length === 0) {
      storage.removeItem(key);
      return;
    }
    const payload: PersistedCartPayloadV1 = {
      version: CART_STORAGE_VERSION_V1,
      siteId,
      items: items.slice(0, CART_MAX_ITEMS_V1),
    };
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Private browsing, quota errors or disabled storage degrade to in-memory cart behavior.
  }
}

function normalizeItemForAdd(item: CartItem): CartItem | null {
  const sanitized = sanitizeCartItem(item);
  if (!sanitized) return null;
  return { ...sanitized, quantity: Math.max(1, Math.min(CART_MAX_ITEM_QUANTITY_V1, sanitized.quantity)) };
}

export const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  siteId: null,
  storageKey: null,
  isHydrated: false,
  items: [],
  setSite: (siteId) =>
    set((state) => {
      const normalized = normalizeCartSiteId(siteId);
      const storageKey = getCartStorageKeyV1(normalized);
      if (!normalized || !storageKey) {
        return state.siteId === null && state.items.length === 0 && state.isHydrated
          ? state
          : { siteId: null, storageKey: null, isHydrated: true, items: [] };
      }
      if (state.siteId === normalized && state.isHydrated) return state;
      return {
        siteId: normalized,
        storageKey,
        isHydrated: true,
        items: readPersistedCart(normalized),
      };
    }),
  syncFromStorage: () =>
    set((state) => {
      if (!state.siteId) return state;
      return { items: readPersistedCart(state.siteId) };
    }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  clear: () =>
    set((state) => {
      persistCart(state.siteId, []);
      return { items: [], isOpen: false };
    }),
  addItem: (item) =>
    set((state) => {
      const normalizedItem = normalizeItemForAdd(item);
      if (!normalizedItem) return state;

      const existing = state.items.find((entry) => entry.variantId === normalizedItem.variantId);
      let items: CartItem[];
      if (!existing) {
        items = state.items.length >= CART_MAX_ITEMS_V1 ? state.items : [...state.items, normalizedItem];
      } else {
        items = state.items.map((entry) =>
          entry.variantId === normalizedItem.variantId
            ? { ...entry, quantity: Math.min(CART_MAX_ITEM_QUANTITY_V1, entry.quantity + normalizedItem.quantity) }
            : entry
        );
      }

      persistCart(state.siteId, items);
      return { isOpen: true, items };
    }),
  removeItem: (variantId) =>
    set((state) => {
      const items = state.items.filter((item) => item.variantId !== variantId);
      persistCart(state.siteId, items);
      return { items };
    }),
  updateQty: (variantId, quantity) =>
    set((state) => {
      const safeQuantity = Number.isInteger(quantity)
        ? Math.max(0, Math.min(CART_MAX_ITEM_QUANTITY_V1, quantity))
        : 0;
      const items = safeQuantity <= 0
        ? state.items.filter((item) => item.variantId !== variantId)
        : state.items.map((item) =>
            item.variantId === variantId ? { ...item, quantity: safeQuantity } : item
          );
      persistCart(state.siteId, items);
      return { items };
    }),
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalMxn: () => get().items.reduce((sum, item) => sum + item.priceMxn * item.quantity, 0),
}));
