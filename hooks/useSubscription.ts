"use client";

import { useCallback, useEffect, useState } from "react";

export interface SubscriptionStatus {
  subscription: {
    id: string;
    status: string;
    interval: string;
    currentPeriodEnd: string | null;
  } | null;
  plan: {
    id: string;
    name: string;
    maxWebsites: number;
    maxVisits: number;
    hasEcommerce: boolean;
    hasAI: boolean;
    hasExport: boolean;
  } | null;
  isActive: boolean;
  usage: {
    websitesUsed: number;
    websitesLimit: number;
    visitsLimit: number;
  } | null;
}

const EMPTY_STATUS: SubscriptionStatus = {
  subscription: null,
  plan: null,
  isActive: false,
  usage: null,
};

export function useSubscription() {
  const [data, setData] = useState<SubscriptionStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/status", {
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        setData(EMPTY_STATUS);
        return;
      }

      const payload = (await response.json()) as SubscriptionStatus & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo cargar la suscripción.");
      }

      setData({
        subscription: payload.subscription ?? null,
        plan: payload.plan ?? null,
        isActive: Boolean(payload.isActive),
        usage: payload.usage ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la suscripción.");
      setData(EMPTY_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
