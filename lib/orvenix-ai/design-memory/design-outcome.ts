export const DESIGN_OUTCOME_V1_VERSION = 1;
export const RECENT_GENERATION_DAYS_V1 = 7;
export const STALE_GENERATION_DAYS_V1 = 30;
export const PUBLISHED_LOW_EDIT_MAX_V1 = 0.15;
export const PUBLISHED_MEDIUM_EDIT_MAX_V1 = 0.35;

export type DesignOutcomeV1Kind =
  | "generated_recent"
  | "generated_unqualified"
  | "generated_stale"
  | "accepted"
  | "edited"
  | "published_low_edit"
  | "published_medium_edit"
  | "published_high_edit"
  | "published_unmeasured";

export interface ComputeDesignOutcomeV1Input {
  status: string;
  editDistance?: number | null;
  createdAt: Date | string;
  now?: Date | string;
}

export interface DesignOutcomeV1 {
  version: typeof DESIGN_OUTCOME_V1_VERSION;
  outcome: DesignOutcomeV1Kind;
  outcomeScore: number | null;
  /**
   * Moment when Orvenix calculated a statistically qualified outcome.
   * It stays null for unqualified or unmeasured outcomes.
   */
  qualifiedAt: Date | null;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 86_400_000);
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function score(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function computeDesignOutcomeV1(input: ComputeDesignOutcomeV1Input): DesignOutcomeV1 {
  const now = toDate(input.now ?? new Date());
  const createdAt = toDate(input.createdAt);
  const ageDays = Number.isFinite(createdAt.getTime()) ? daysBetween(createdAt, now) : 0;
  const qualifiedAt = new Date(now);

  if (input.status === "published") {
    if (typeof input.editDistance !== "number" || !Number.isFinite(input.editDistance) || input.editDistance < 0 || input.editDistance > 1) {
      return {
        version: DESIGN_OUTCOME_V1_VERSION,
        outcome: "published_unmeasured",
        outcomeScore: null,
        qualifiedAt: null,
      };
    }

    const editDistance = input.editDistance;

    if (editDistance <= PUBLISHED_LOW_EDIT_MAX_V1) {
      return {
        version: DESIGN_OUTCOME_V1_VERSION,
        outcome: "published_low_edit",
        outcomeScore: 1,
        qualifiedAt,
      };
    }

    if (editDistance <= PUBLISHED_MEDIUM_EDIT_MAX_V1) {
      return {
        version: DESIGN_OUTCOME_V1_VERSION,
        outcome: "published_medium_edit",
        outcomeScore: score(0.8),
        qualifiedAt,
      };
    }

    return {
      version: DESIGN_OUTCOME_V1_VERSION,
      outcome: "published_high_edit",
      outcomeScore: score(0.6),
      qualifiedAt,
    };
  }

  if (input.status === "edited") {
    return {
      version: DESIGN_OUTCOME_V1_VERSION,
      outcome: "edited",
      outcomeScore: score(0.45),
      qualifiedAt,
    };
  }

  if (input.status === "accepted") {
    return {
      version: DESIGN_OUTCOME_V1_VERSION,
      outcome: "accepted",
      outcomeScore: score(0.4),
      qualifiedAt,
    };
  }

  if (input.status === "generated") {
    if (ageDays < RECENT_GENERATION_DAYS_V1) {
      return {
        version: DESIGN_OUTCOME_V1_VERSION,
        outcome: "generated_recent",
        outcomeScore: null,
        qualifiedAt: null,
      };
    }

    if (ageDays < STALE_GENERATION_DAYS_V1) {
      return {
        version: DESIGN_OUTCOME_V1_VERSION,
        outcome: "generated_unqualified",
        outcomeScore: null,
        qualifiedAt: null,
      };
    }

    return {
      version: DESIGN_OUTCOME_V1_VERSION,
      outcome: "generated_stale",
      outcomeScore: score(0.1),
      qualifiedAt,
    };
  }

  return {
    version: DESIGN_OUTCOME_V1_VERSION,
    outcome: "generated_unqualified",
    outcomeScore: null,
    qualifiedAt: null,
  };
}
