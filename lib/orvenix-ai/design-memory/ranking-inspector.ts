import {
  MIN_L1_QUALIFIED_SAMPLE,
  MIN_L2_QUALIFIED_SAMPLE,
  type DesignPatternRankingV1,
  type DesignPatternRankingV1Confidence,
  type DesignPatternRankingV1Level,
} from "./design-ranking";

export type DesignRankingInspectionV1 = {
  version: 1;
  level: DesignPatternRankingV1Level;
  totalPatterns: number;
  eligiblePatterns: number;
  insufficientPatterns: number;
  topPatterns: DesignRankingInspectionEntryV1[];
};

export type DesignRankingInspectionEntryV1 = {
  rank: number | null;
  patternKey: unknown;
  patternKeyHash: string;
  rankingScore: number | null;
  confidence: DesignPatternRankingV1Confidence;
  sampleSize: number;
  matureSampleSize: number;
  qualifiedSampleSize: number;
  designQualitySampleSize: number;
  acceptRate: number | null;
  publishRate: number | null;
  measuredPublishRate: number | null;
  avgOutcomeScore: number | null;
  avgEditDistance: number | null;
  lowEditPublishRate: number | null;
  explanation: string[];
};

export type InspectDesignPatternRankingV1Options = {
  level?: DesignPatternRankingV1Level;
  limit?: number;
  includeInsufficient?: boolean;
};

export type GetDesignPatternRankingInspectionV1Input = {
  level: DesignPatternRankingV1Level;
  limit?: number;
  includeInsufficient?: boolean;
};

export type GetDesignPatternRankingInspectionV1Result =
  | {
      ok: true;
      inspection: DesignRankingInspectionV1;
    }
  | {
      ok: false;
      inspection: null;
      error: string;
    };

function minimumQualifiedSample(level: DesignPatternRankingV1Level) {
  return level === "L1" ? MIN_L1_QUALIFIED_SAMPLE : MIN_L2_QUALIFIED_SAMPLE;
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined) return null;
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

function metric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function percent(value: number) {
  return `${metric(value * 100)}%`;
}

function explainRankingEntry(
  ranking: DesignPatternRankingV1,
  level: DesignPatternRankingV1Level,
): string[] {
  const required = minimumQualifiedSample(level);

  if (ranking.rankingScore === null) {
    return [
      `Insufficient qualified sample: ${ranking.qualifiedSampleSize}/${required} required for ${level}.`,
      `Confidence: ${ranking.confidence}.`,
    ];
  }

  const explanation = [
    `Eligible with ${ranking.qualifiedSampleSize} qualified samples.`,
    `Bayesian ranking score: ${metric(ranking.rankingScore)}.`,
    `Confidence: ${ranking.confidence}.`,
  ];

  if (ranking.publishRate !== null) {
    explanation.push(`Published in ${percent(ranking.publishRate)} of mature lifecycle samples.`);
  }

  if (ranking.avgOutcomeScore !== null) {
    explanation.push(`Average outcome score: ${metric(ranking.avgOutcomeScore)}.`);
  }

  if (ranking.avgEditDistance !== null) {
    explanation.push(`Average edit distance among measured publications: ${metric(ranking.avgEditDistance)}.`);
  }

  if (ranking.lowEditPublishRate !== null) {
    explanation.push(`${percent(ranking.lowEditPublishRate)} of measured publications were low-edit.`);
  }

  return explanation;
}

function toInspectionEntry(
  ranking: DesignPatternRankingV1,
  rank: number | null,
  level: DesignPatternRankingV1Level,
): DesignRankingInspectionEntryV1 {
  return {
    rank,
    patternKey: ranking.patternKey,
    patternKeyHash: ranking.patternKeyHash,
    rankingScore: ranking.rankingScore,
    confidence: ranking.confidence,
    sampleSize: ranking.sampleSize,
    matureSampleSize: ranking.matureSampleSize,
    qualifiedSampleSize: ranking.qualifiedSampleSize,
    designQualitySampleSize: ranking.designQualitySampleSize,
    acceptRate: ranking.acceptRate,
    publishRate: ranking.publishRate,
    measuredPublishRate: ranking.measuredPublishRate,
    avgOutcomeScore: ranking.avgOutcomeScore,
    avgEditDistance: ranking.avgEditDistance,
    lowEditPublishRate: ranking.lowEditPublishRate,
    explanation: explainRankingEntry(ranking, level),
  };
}

function resolveLevel(
  rankings: DesignPatternRankingV1[],
  level: DesignPatternRankingV1Level | undefined,
): DesignPatternRankingV1Level {
  if (level === "L1" || level === "L2") return level;
  return rankings[0]?.level ?? "L1";
}

export function inspectDesignPatternRankingV1(
  rankings: DesignPatternRankingV1[],
  options: InspectDesignPatternRankingV1Options = {},
): DesignRankingInspectionV1 {
  const level = resolveLevel(rankings, options.level);
  const includeInsufficient = options.includeInsufficient ?? false;
  const limit = normalizeLimit(options.limit);
  let nextRank = 1;

  const entries = rankings.map((ranking) => {
    const rank = ranking.rankingScore === null ? null : nextRank++;
    return toInspectionEntry(ranking, rank, level);
  });

  const visibleEntries = includeInsufficient
    ? entries
    : entries.filter((entry) => entry.rank !== null);
  const topPatterns = limit === null ? visibleEntries : visibleEntries.slice(0, limit);

  return {
    version: 1,
    level,
    totalPatterns: rankings.length,
    eligiblePatterns: entries.filter((entry) => entry.rank !== null).length,
    insufficientPatterns: entries.filter((entry) => entry.rank === null).length,
    topPatterns,
  };
}

export async function getDesignPatternRankingInspectionV1(
  input: GetDesignPatternRankingInspectionV1Input,
): Promise<GetDesignPatternRankingInspectionV1Result> {
  try {
    if (input.level !== "L1" && input.level !== "L2") {
      return {
        ok: false,
        inspection: null,
        error: "No se pudo inspeccionar el ranking de patrones de diseño.",
      };
    }

    const { getDesignPatternRankingV1 } = await import("./ranking-reader");
    const result = await getDesignPatternRankingV1({ level: input.level });

    if (!result.ok) {
      return {
        ok: false,
        inspection: null,
        error: "No se pudo inspeccionar el ranking de patrones de diseño.",
      };
    }

    return {
      ok: true,
      inspection: inspectDesignPatternRankingV1(result.rankings, {
        level: input.level,
        limit: input.limit,
        includeInsufficient: input.includeInsufficient,
      }),
    };
  } catch (error) {
    console.error("[Orvenix Design Memory] No se pudo inspeccionar el ranking de patrones:", error);

    return {
      ok: false,
      inspection: null,
      error: "No se pudo inspeccionar el ranking de patrones de diseño.",
    };
  }
}
