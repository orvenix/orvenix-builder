import type { EditorTree } from "@/types/editor";

export type CheckoutAction = "rent" | "buy";

export interface PendingDesignDraft {
  version: 1;
  key: string;
  action: CheckoutAction;
  sourceSiteId?: string | null;
  draftWebsiteId?: string | null;
  tree: EditorTree;
  createdAt: string;
  returnTo?: string;
}

export const PENDING_DESIGN_PREFIX = "orvenix_pending_design:v1:";
export const PENDING_DESIGN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3;

export function createPendingDesignKey() {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${PENDING_DESIGN_PREFIX}${random}`;
}

export function isPendingDesignDraft(value: unknown): value is PendingDesignDraft {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PendingDesignDraft>;
  return (
    candidate.version === 1 &&
    typeof candidate.key === "string" &&
    (candidate.action === "buy" || candidate.action === "rent") &&
    typeof candidate.createdAt === "string" &&
    Boolean(candidate.tree)
  );
}

export function isPendingDesignExpired(draft: PendingDesignDraft) {
  const createdAt = Date.parse(draft.createdAt);
  if (!Number.isFinite(createdAt)) return true;
  return Date.now() - createdAt > PENDING_DESIGN_MAX_AGE_MS;
}
