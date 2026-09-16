import { createHash } from "node:crypto";

import {
  canonicalDesignPatternJson,
  createDesignPatternLevelHash,
  createDesignPatternLevelKey,
  type DesignPatternV1,
} from "./design-pattern";
import {
  compareDesignPatternRankingV1,
  isDesignPatternV1,
  type DesignPatternRankingV1,
  type DesignPatternRankingV1Confidence,
} from "./design-ranking";

export type DesignPatternSelectorV1Constraints = {
  preserveTheme?: boolean;
  preserveStyle?: boolean;
};

export type DesignPatternSelectionTargetV1 = {
  version: 1;
  context: DesignPatternV1["context"];
  l1Key: unknown;
  l1KeyHash: string;
  l2Key?: unknown;
  l2KeyHash?: string;
};

export type SelectDesignPatternV1Input = {
  targetPattern?: unknown;
  target?: DesignPatternSelectionTargetV1;
  l1Rankings: DesignPatternRankingV1[];
  l2Rankings: DesignPatternRankingV1[];
  constraints?: DesignPatternSelectorV1Constraints;
};

export type DesignPatternSelectionV1 =
  | {
      version: 1;
      decision: "recommend";
      level: "L1" | "L2";
      patternKey: unknown;
      patternKeyHash: string;
      rankingScore: number;
      confidence: Exclude<DesignPatternRankingV1Confidence, "insufficient">;
      qualifiedSampleSize: number;
      fallbackUsed: boolean;
      reason: string[];
    }
  | {
      version: 1;
      decision: "abstain";
      reasonCode:
        | "no_compatible_pattern"
        | "insufficient_evidence"
        | "constraint_preserved"
        | "invalid_target";
      reason: string[];
    };

type PatternLevelKey = {
  version: number;
  context: unknown;
  theme?: unknown;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isPatternLevelKey(value: unknown): value is PatternLevelKey {
  return isPlainRecord(value) && value.version === 1 && isPlainRecord(value.context);
}

function levelKeyHash(value: unknown) {
  return createHash("sha256")
    .update(canonicalDesignPatternJson(value))
    .digest("hex");
}

function l1HashFromLevelKey(value: unknown) {
  if (!isPatternLevelKey(value)) return null;
  return levelKeyHash({
    version: value.version,
    context: value.context,
  });
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isSelectionTarget(value: unknown): value is DesignPatternSelectionTargetV1 {
  return (
    isPlainRecord(value) &&
    value.version === 1 &&
    isPlainRecord(value.context) &&
    isSha256Hex(value.l1KeyHash) &&
    (value.l2KeyHash === undefined || isSha256Hex(value.l2KeyHash))
  );
}

function isEligibleRanking(ranking: DesignPatternRankingV1): ranking is DesignPatternRankingV1 & {
  rankingScore: number;
  confidence: Exclude<DesignPatternRankingV1Confidence, "insufficient">;
} {
  return ranking.rankingScore !== null && ranking.confidence !== "insufficient";
}

function isRankingLevel(ranking: DesignPatternRankingV1, level: "L1" | "L2") {
  return ranking.level === level;
}

function sortByRankingOrder(rankings: DesignPatternRankingV1[]) {
  return [...rankings].sort(compareDesignPatternRankingV1);
}

function metric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function recommendationFor(
  ranking: DesignPatternRankingV1 & {
    rankingScore: number;
    confidence: Exclude<DesignPatternRankingV1Confidence, "insufficient">;
  },
  params: {
    level: "L1" | "L2";
    fallbackUsed: boolean;
  },
): DesignPatternSelectionV1 {
  return {
    version: 1,
    decision: "recommend",
    level: params.level,
    patternKey: ranking.patternKey,
    patternKeyHash: ranking.patternKeyHash,
    rankingScore: ranking.rankingScore,
    confidence: ranking.confidence,
    qualifiedSampleSize: ranking.qualifiedSampleSize,
    fallbackUsed: params.fallbackUsed,
    reason: [
      `Selected ${params.level} compatible pattern.`,
      `Ranking score: ${metric(ranking.rankingScore)}.`,
      `Confidence: ${ranking.confidence}.`,
      `Qualified samples: ${ranking.qualifiedSampleSize}.`,
      `Fallback used: ${params.fallbackUsed ? "true" : "false"}.`,
    ],
  };
}

function abstain(
  reasonCode: Extract<DesignPatternSelectionV1, { decision: "abstain" }>["reasonCode"],
  reason: string[],
): DesignPatternSelectionV1 {
  return {
    version: 1,
    decision: "abstain",
    reasonCode,
    reason,
  };
}

export function createDesignPatternSelectionTargetV1(params: {
  context: DesignPatternV1["context"];
  theme?: DesignPatternV1["theme"] | null;
}): DesignPatternSelectionTargetV1 {
  const l1Key = {
    version: 1,
    context: structuredClone(params.context),
  };
  const l2Key = params.theme
    ? {
        ...l1Key,
        theme: structuredClone(params.theme),
      }
    : undefined;

  return {
    version: 1,
    context: structuredClone(params.context),
    l1Key,
    l1KeyHash: levelKeyHash(l1Key),
    ...(l2Key
      ? {
          l2Key,
          l2KeyHash: levelKeyHash(l2Key),
        }
      : {}),
  };
}

function targetFromPattern(value: unknown): DesignPatternSelectionTargetV1 | null {
  if (!isDesignPatternV1(value)) return null;
  const pattern = structuredClone(value) as DesignPatternV1;
  return {
    version: 1,
    context: pattern.context,
    l1Key: JSON.parse(createDesignPatternLevelKey(pattern, "L1")) as unknown,
    l1KeyHash: createDesignPatternLevelHash(pattern, "L1"),
    l2Key: JSON.parse(createDesignPatternLevelKey(pattern, "L2")) as unknown,
    l2KeyHash: createDesignPatternLevelHash(pattern, "L2"),
  };
}

function resolveTarget(input: SelectDesignPatternV1Input) {
  if (input.target && isSelectionTarget(input.target)) return input.target;
  return targetFromPattern(input.targetPattern);
}

export function selectDesignPatternV1(input: SelectDesignPatternV1Input): DesignPatternSelectionV1 {
  const target = resolveTarget(input);

  if (!target) {
    return abstain("invalid_target", ["Target pattern is not a valid DesignPatternV1 or pre-plan target."]);
  }

  const constraints = input.constraints ?? {};
  const targetStyle = target.context.styleBucket;
  const targetL1Hash = target.l1KeyHash;
  const targetL2Hash = target.l2KeyHash ?? null;
  const targetL1Key = canonicalDesignPatternJson(target.l1Key);
  const targetL2Key = target.l2Key ? canonicalDesignPatternJson(target.l2Key) : null;

  const compatibleL2Rankings = sortByRankingOrder(input.l2Rankings).filter((ranking) => {
    if (!isRankingLevel(ranking, "L2")) return false;
    if (l1HashFromLevelKey(ranking.patternKey) !== targetL1Hash) return false;
    if (constraints.preserveTheme) {
      if (!targetL2Hash) return false;
      if (ranking.patternKeyHash !== targetL2Hash) return false;
    }
    if (constraints.preserveStyle && isPatternLevelKey(ranking.patternKey)) {
      const style = isPlainRecord(ranking.patternKey.context) ? ranking.patternKey.context.styleBucket : undefined;
      if (style !== targetStyle) return false;
    }
    return true;
  });

  const eligibleL2 = compatibleL2Rankings.find(isEligibleRanking);
  if (eligibleL2) {
    return recommendationFor(eligibleL2, {
      level: "L2",
      fallbackUsed: false,
    });
  }

  const compatibleL1Rankings = sortByRankingOrder(input.l1Rankings).filter((ranking) => {
    if (!isRankingLevel(ranking, "L1")) return false;
    if (ranking.patternKeyHash !== targetL1Hash) return false;
    if (constraints.preserveStyle && isPatternLevelKey(ranking.patternKey)) {
      const style = isPlainRecord(ranking.patternKey.context) ? ranking.patternKey.context.styleBucket : undefined;
      if (style !== targetStyle) return false;
    }
    return true;
  });

  const eligibleL1 = compatibleL1Rankings.find(isEligibleRanking);
  if (eligibleL1) {
    return recommendationFor(eligibleL1, {
      level: "L1",
      fallbackUsed: true,
    });
  }

  const hasAnyCompatible = compatibleL2Rankings.length > 0 || compatibleL1Rankings.length > 0;
  const hasConstraintBlockedTheme = Boolean(
    constraints.preserveTheme &&
    input.l2Rankings.some((ranking) =>
      isRankingLevel(ranking, "L2") &&
      l1HashFromLevelKey(ranking.patternKey) === targetL1Hash &&
      (!targetL2Hash || ranking.patternKeyHash !== targetL2Hash) &&
      isEligibleRanking(ranking),
    ),
  );

  if (hasConstraintBlockedTheme) {
    return abstain("constraint_preserved", [
      "Theme preservation blocked higher-ranked incompatible L2 evidence.",
      `Target L1 key: ${targetL1Key}.`,
      ...(targetL2Key ? [`Target L2 key: ${targetL2Key}.`] : []),
    ]);
  }

  if (!hasAnyCompatible) {
    return abstain("no_compatible_pattern", [
      "No compatible L1 or L2 pattern evidence was found.",
      `Target L1 key: ${targetL1Key}.`,
    ]);
  }

  return abstain("insufficient_evidence", [
    "Compatible pattern evidence exists but is not eligible for recommendation.",
    `Compatible L2 patterns: ${compatibleL2Rankings.length}.`,
    `Compatible L1 patterns: ${compatibleL1Rankings.length}.`,
  ]);
}
