"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DataBinding } from "@/types/editor";

interface RecordData {
  id: string;
  data: Record<string, unknown>;
  resolvedData?: Record<string, unknown>;
}

// Cache global en memoria para no re-fetchear cada render
const CACHE = new Map<string, RecordData | null>();
const PENDING = new Map<string, Promise<RecordData | null>>();

async function fetchBoundRecord(
  siteId: string,
  binding: DataBinding
): Promise<RecordData | null> {
  const recordStatus = binding.recordStatus ?? "all";
  const recordId = typeof binding.recordId === "string" ? binding.recordId : "";
  const key = `${siteId}:${binding.collectionSlug}:${recordStatus}:${recordId || "first"}`;
  if (CACHE.has(key)) return CACHE.get(key) ?? null;
  if (PENDING.has(key)) return PENDING.get(key)!;

  const params = new URLSearchParams({
    limit: "1",
    expand: "relations",
  });
  if (recordStatus !== "all") params.set("status", recordStatus);
  if (recordId) {
    params.set("recordId", recordId);
    params.set("limit", "50");
  }

  const p = fetch(`/api/cms/${siteId}/collections/${binding.collectionSlug}/records?${params.toString()}`)
    .then((r) => r.json())
    .then((d: { records?: RecordData[] }) => {
      const record = recordId
        ? (d.records ?? []).find((item) => item.id === recordId) ?? null
        : d.records?.[0] ?? null;
      CACHE.set(key, record);
      PENDING.delete(key);
      return record;
    })
    .catch(() => {
      CACHE.set(key, null);
      PENDING.delete(key);
      return null;
    });

  PENDING.set(key, p);
  return p;
}

/**
 * Resuelve los bindings de un nodo retornando las props con valores reales.
 * En modo editor muestra el primer registro de cada colección como preview.
 */
export function useResolvedBindings(
  siteId: string | null,
  bindings: Record<string, DataBinding> | undefined,
  originalProps: Record<string, unknown>
): Record<string, unknown> {
  const [resolvedPatch, setResolvedPatch] = useState<Record<string, unknown>>({});
  const prevBindingsRef = useRef<string>("");
  const bindingsKey = bindings && Object.keys(bindings).length > 0
    ? JSON.stringify(bindings)
    : "";

  useEffect(() => {
    if (!siteId || !bindings || !bindingsKey) return;
    if (bindingsKey === prevBindingsRef.current) return;
    prevBindingsRef.current = bindingsKey;

    // Colecciones únicas necesarias
    const bindingEntries = Object.entries(bindings);

    Promise.all(bindingEntries.map(([, binding]) => fetchBoundRecord(siteId, binding))).then((records) => {
      const recordMap = new Map(
        bindingEntries.map(([propKey, binding], index) => [
          `${propKey}:${binding.collectionSlug}:${binding.fieldSlug}:${binding.recordStatus ?? "all"}:${binding.recordId ?? ""}`,
          records[index],
        ])
      );

      const patch: Record<string, unknown> = {};
      for (const [propKey, binding] of bindingEntries) {
        const record = recordMap.get(`${propKey}:${binding.collectionSlug}:${binding.fieldSlug}:${binding.recordStatus ?? "all"}:${binding.recordId ?? ""}`);
        if (record) {
          patch[propKey] =
            record.resolvedData?.[binding.fieldSlug] ??
            record.data[binding.fieldSlug] ??
            originalProps[propKey];
        }
      }

      setResolvedPatch(patch);
    });
  }, [siteId, bindings, bindingsKey, originalProps]);

  return useMemo(
    () => bindingsKey ? { ...originalProps, ...resolvedPatch } : originalProps,
    [bindingsKey, originalProps, resolvedPatch]
  );
}
