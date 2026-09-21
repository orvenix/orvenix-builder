import type { DesignPatternSelectionV1 } from "./pattern-selector";

export type DesignPlannerPriorV1Confidence = "low" | "medium" | "high";

export type DesignPlannerPriorV1 = {
  version: 1;
  source: "design_memory";
  mode: "advisory";
  rankingVersion: 1;
  patternVersion: 1;
  level: "L1" | "L2";
  patternKeyHash: string;
  evidence: {
    rankingScore: number;
    confidence: DesignPlannerPriorV1Confidence;
    qualifiedSampleSize: number;
    fallbackUsed: boolean;
  };
  recommendation: {
    context?: unknown;
    theme?: unknown;
  };
  reason: string[];
};

export type CreateDesignPlannerPriorV1Input = {
  selection: DesignPatternSelectionV1;
};

type LevelPatternKey = {
  version: number;
  context?: unknown;
  theme?: unknown;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isFiniteRatio(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0) && value >= 0 && value <= 1;
}

function isValidConfidence(value: unknown): value is DesignPlannerPriorV1Confidence {
  return value === "low" || value === "medium" || value === "high";
}

function isValidSampleSize(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isLevelPatternKey(value: unknown): value is LevelPatternKey {
  return isPlainRecord(value) && value.version === 1 && isPlainRecord(value.context);
}

function hasL2Theme(value: LevelPatternKey): value is LevelPatternKey & { theme: unknown } {
  return "theme" in value && isPlainRecord(value.theme);
}

function cloneJsonValue<T>(value: T): T {
  return structuredClone(value);
}

function metric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function createDesignPlannerPriorV1(
  input: CreateDesignPlannerPriorV1Input,
): DesignPlannerPriorV1 | null {
  const { selection } = input;

  if (selection.decision === "abstain") return null;
  if (!isFiniteRatio(selection.rankingScore)) return null;
  if (!isValidConfidence(selection.confidence)) return null;
  if (!isValidSampleSize(selection.qualifiedSampleSize)) return null;
  if (!isSha256Hex(selection.patternKeyHash)) return null;
  if (!isLevelPatternKey(selection.patternKey)) return null;

  const patternKey = selection.patternKey;
  const recommendation: DesignPlannerPriorV1["recommendation"] = {
    context: cloneJsonValue(patternKey.context),
  };

  if (selection.level === "L2") {
    if (!hasL2Theme(patternKey)) return null;
    recommendation.theme = cloneJsonValue(patternKey.theme);
  }

  if (selection.level === "L1" && !selection.fallbackUsed) return null;

  return {
    version: 1,
    source: "design_memory",
    mode: "advisory",
    rankingVersion: 1,
    patternVersion: 1,
    level: selection.level,
    patternKeyHash: selection.patternKeyHash,
    evidence: {
      rankingScore: selection.rankingScore,
      confidence: selection.confidence,
      qualifiedSampleSize: selection.qualifiedSampleSize,
      fallbackUsed: selection.fallbackUsed,
    },
    recommendation,
    reason: [
      `Design Memory selected ${selection.level} advisory evidence.`,
      `Ranking score: ${metric(selection.rankingScore)}.`,
      `Confidence: ${selection.confidence}.`,
      `Qualified samples: ${selection.qualifiedSampleSize}.`,
      `Fallback used: ${selection.fallbackUsed ? "true" : "false"}.`,
    ],
  };
}
