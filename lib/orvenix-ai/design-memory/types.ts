import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2";

export type DesignGenerationStatus =
  | "generated"
  | "accepted"
  | "edited"
  | "published"
  | "abandoned";

export interface RecordDesignGenerationInput {
  userId: string;
  request: string;
  industry?: string;
  siteType?: string;
  objective?: string;
  requestedStyle?: string;
  initialPlan: SiteCreationPlanV2;
  initialPlanHash: string;
  siteCreationAttemptId?: string;
}

export interface RecordDesignGenerationResult {
  ok: boolean;
  generationId?: string;
  error?: string;
}

export interface AcceptDesignGenerationInput {
  userId: string;
  request: string;
  initialPlanHash: string;
  siteId: string;
}

export interface AcceptDesignGenerationResult {
  ok: boolean;
  generationId?: string;
  siteId?: string;
  status?: "accepted";
  error?: string;
}

export interface MarkDesignGenerationEditedInput {
  siteId: string;
}

export interface MarkDesignGenerationEditedResult {
  ok: boolean;
  siteId?: string;
  status?: "edited";
  updatedCount?: number;
  error?: string;
}

export interface MarkDesignGenerationPublishedInput {
  siteId: string;
}

export interface MarkDesignGenerationPublishedResult {
  ok: boolean;
  siteId?: string;
  status?: "published";
  updatedCount?: number;
  error?: string;
}

export interface MeasureDesignGenerationEditMetricsInput {
  siteId: string;
}

export interface RefreshDesignGenerationOutcomeInput {
  siteId: string;
  now?: Date;
}

export interface MeasureDesignGenerationEditMetricsResult {
  ok: boolean;
  siteId?: string;
  generationId?: string;
  metrics?: import("./edit-metrics").DesignGenerationEditMetrics;
  editDistance?: number;
  measuredAt?: string;
  error?: string;
}

export interface RefreshDesignGenerationOutcomeResult {
  ok: boolean;
  siteId?: string;
  generationId?: string;
  outcomeVersion?: number;
  outcomeScore?: number | null;
  outcomeQualifiedAt?: string | null;
  error?: string;
}
