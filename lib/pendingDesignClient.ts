"use client";

import { clearSavedTree } from "@/hooks/useAutosave";
import {
  isPendingDesignDraft,
  isPendingDesignExpired,
  type PendingDesignDraft,
} from "@/lib/pendingDesignDraft";

export function readPendingDesignDraft(key: string): PendingDesignDraft | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPendingDesignDraft(parsed) || isPendingDesignExpired(parsed)) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function consumePendingDesignDraft(key: string, draft: PendingDesignDraft) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(key);
  if (draft.draftWebsiteId?.startsWith("draft:")) {
    clearSavedTree(draft.draftWebsiteId);
  }
}
