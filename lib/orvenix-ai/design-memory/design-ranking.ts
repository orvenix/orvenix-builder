import { createHash } from "node:crypto";

import {
  createDesignPatternLevelKey,
  type DesignPatternV1,
} from "./design-pattern";
import {
  DESIGN_OUTCOME_V1_VERSION,
  PUBLISHED_LOW_EDIT_MAX_V1,
  PUBLISHED_MEDIUM_EDIT_MAX_V1,
} from "./design-outcome";

export const DESIGN_RANKING_V1_VERSION = 1;
export const MIN_L1_QUALIFIED_SAMPLE = 10;
export const MIN_L2_QUALIFIED_SAMPLE = 5;
export const PRIOR_MEAN = 0.4;
export const PRIOR_WEIGHT_L1 = 8;
export const PRIOR_WEIGHT_L2 = 10;

export type DesignPatternRankingV1Level = "L1" | "L2";
export type DesignPatternRankingV1Confidence = "insufficient" | "low" | "medium" | "high";

export type DesignRankingInputV1 = {
  patternVersion: number | null;
  patternKey: unknown;
  outcomeVersion: number | null;
  outcomeScore: number | null;
  status: string;
  editDistance: number | null;
  createdAt: Date;
  outcomeQualifiedAt: Date | null;
};

export type DesignPatternRankingV1 = {
  version: typeof DESIGN_RANKING_V1_VERSION;
  level: DesignPatternRankingV1Level;
  patternKey: unknown;
  patternKeyHash: string;
  sampleSize: number;
  matureSampleSize: number;
  qualifiedSampleSize: number;
  designQualitySampleSize: number;
  generatedCount: number;
  staleCount: number;
  acceptedCount: number;
  editedCount: number;
  publishedCount: number;
  measuredPublishedCount: number;
  acceptRate: number | null;
  publishRate: number | null;
  measuredPublishRate: number | null;
  avgOutcomeScore: number | null;
  avgEditDistance: number | null;
  lowEditPublishedCount: number;
  mediumEditPublishedCount: number;
  highEditPublishedCount: number;
  lowEditPublishRate: number | null;
  rankingScore: number | null;
  confidence: DesignPatternRankingV1Confidence;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
};

type ClassifiedRankingSampleV1 = {
  pattern: DesignPatternV1;
  levelKey: unknown;
  levelKeyHash: string;
  status: "generated" | "accepted" | "edited" | "published" | "other";
  createdAt: Date;
  isMatureLifecycle: boolean;
  isQualifiedRanking: boolean;
  isDesignQuality: boolean;
  outcomeScore: number | null;
  editDistance: number | null;
  publishedEditBucket: "low" | "medium" | "high" | null;
};

type MutableRankingAggregate = Omit<DesignPatternRankingV1, "version" | "rankingScore" | "confidence" | "firstSeenAt" | "lastSeenAt"> & {
  outcomeScores: number[];
  editDistances: number[];
  firstSeenAtMs: number | null;
  lastSeenAtMs: number | null;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasStringOrNull(value: unknown) {
  return typeof value === "string" || value === null;
}

function hasStringArray(value: unknown) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isFiniteDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isFiniteRatio(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0) && value >= 0 && value <= 1;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function rate(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return clamp01(numerator / denominator);
}

function stableSum(values: number[]) {
  return [...values].sort((a, b) => a - b).reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (values.length <= 0) return null;
  return clamp01(stableSum(values) / values.length);
}

function patternKeyHash(levelKeyJson: string) {
  return createHash("sha256").update(levelKeyJson).digest("hex");
}

function parseCanonicalKey(levelKeyJson: string): unknown {
  return JSON.parse(levelKeyJson) as unknown;
}

export function isDesignPatternV1(value: unknown): value is DesignPatternV1 {
  if (!isPlainRecord(value) || value.version !== 1) return false;

  const context = value.context;
  const architecture = value.architecture;
  const conversion = value.conversion;
  const theme = value.theme;
  const layout = value.layout;

  return (
    isPlainRecord(context) &&
    hasStringOrNull(context.industryBucket) &&
    hasStringOrNull(context.siteType) &&
    hasStringOrNull(context.objectiveBucket) &&
    hasStringOrNull(context.styleBucket) &&
    isPlainRecord(architecture) &&
    typeof architecture.pageCountBucket === "string" &&
    hasStringArray(architecture.pageTypes) &&
    hasStringArray(architecture.navigationOrder) &&
    hasStringArray(architecture.homeSectionOrder) &&
    hasStringArray(architecture.requiredSections) &&
    isPlainRecord(conversion) &&
    typeof conversion.heroHasCta === "boolean" &&
    typeof conversion.finalCta === "boolean" &&
    typeof conversion.ctaCountBucket === "string" &&
    typeof conversion.contactPresence === "boolean" &&
    isPlainRecord(theme) &&
    hasStringOrNull(theme.mode) &&
    hasStringOrNull(theme.accentHue) &&
    hasStringOrNull(theme.contrastBucket) &&
    hasStringOrNull(theme.radiusBucket) &&
    hasStringOrNull(theme.typographyBucket) &&
    hasStringOrNull(theme.motionBucket) &&
    isPlainRecord(layout) &&
    typeof layout.densityBucket === "string" &&
    typeof layout.mediaPresenceBucket === "string" &&
    typeof layout.sectionCountBucket === "string"
  );
}

function normalizeStatus(value: string): ClassifiedRankingSampleV1["status"] {
  if (value === "generated" || value === "accepted" || value === "edited" || value === "published") return value;
  return "other";
}

function editBucket(editDistance: number | null) {
  if (!isFiniteRatio(editDistance)) return null;
  if (editDistance <= PUBLISHED_LOW_EDIT_MAX_V1) return "low";
  if (editDistance <= PUBLISHED_MEDIUM_EDIT_MAX_V1) return "medium";
  return "high";
}

export function classifyRankingSampleV1(
  row: DesignRankingInputV1,
  level: DesignPatternRankingV1Level,
): ClassifiedRankingSampleV1 | null {
  if (row.patternVersion !== 1 || !isDesignPatternV1(row.patternKey) || !isFiniteDate(row.createdAt)) return null;

  const status = normalizeStatus(row.status);
  if (status === "other") return null;

  const levelKeyJson = createDesignPatternLevelKey(row.patternKey, level);
  const levelKey = parseCanonicalKey(levelKeyJson);
  const outcomeScore = row.outcomeVersion === DESIGN_OUTCOME_V1_VERSION && isFiniteRatio(row.outcomeScore)
    ? row.outcomeScore
    : null;
  const measuredEditDistance = status === "published" && isFiniteRatio(row.editDistance)
    ? row.editDistance
    : null;
  const publishedEditBucket = editBucket(measuredEditDistance);

  // published_unmeasured is a real mature lifecycle event, but not a qualified ranking or design-quality sample.
  const isMatureLifecycle =
    status === "accepted" ||
    status === "edited" ||
    status === "published" ||
    (status === "generated" && outcomeScore !== null);
  const isQualifiedRanking = isMatureLifecycle && outcomeScore !== null;
  const isDesignQuality = status === "published" && measuredEditDistance !== null;

  return {
    pattern: row.patternKey,
    levelKey,
    levelKeyHash: patternKeyHash(levelKeyJson),
    status,
    createdAt: row.createdAt,
    isMatureLifecycle,
    isQualifiedRanking,
    isDesignQuality,
    outcomeScore,
    editDistance: measuredEditDistance,
    publishedEditBucket,
  };
}

function minimumQualifiedSample(level: DesignPatternRankingV1Level) {
  return level === "L1" ? MIN_L1_QUALIFIED_SAMPLE : MIN_L2_QUALIFIED_SAMPLE;
}

function priorWeight(level: DesignPatternRankingV1Level) {
  return level === "L1" ? PRIOR_WEIGHT_L1 : PRIOR_WEIGHT_L2;
}

export function computeBayesianRankingScoreV1(params: {
  level: DesignPatternRankingV1Level;
  qualifiedSampleSize: number;
  sumQualifiedOutcomeScores: number;
}) {
  const minimum = minimumQualifiedSample(params.level);
  if (params.qualifiedSampleSize < minimum) return null;

  const weight = priorWeight(params.level);
  return clamp01(
    (params.sumQualifiedOutcomeScores + PRIOR_MEAN * weight) /
    (params.qualifiedSampleSize + weight),
  );
}

function confidenceFor(level: DesignPatternRankingV1Level, qualifiedSampleSize: number): DesignPatternRankingV1Confidence {
  const minimum = minimumQualifiedSample(level);
  if (qualifiedSampleSize < minimum) return "insufficient";
  if (qualifiedSampleSize < minimum * 2) return "low";
  if (qualifiedSampleSize < minimum * 5) return "medium";
  return "high";
}

function createAggregate(sample: ClassifiedRankingSampleV1, level: DesignPatternRankingV1Level): MutableRankingAggregate {
  const createdAtMs = sample.createdAt.getTime();
  return {
    level,
    patternKey: sample.levelKey,
    patternKeyHash: sample.levelKeyHash,
    sampleSize: 0,
    matureSampleSize: 0,
    qualifiedSampleSize: 0,
    designQualitySampleSize: 0,
    generatedCount: 0,
    staleCount: 0,
    acceptedCount: 0,
    editedCount: 0,
    publishedCount: 0,
    measuredPublishedCount: 0,
    acceptRate: null,
    publishRate: null,
    measuredPublishRate: null,
    avgOutcomeScore: null,
    avgEditDistance: null,
    lowEditPublishedCount: 0,
    mediumEditPublishedCount: 0,
    highEditPublishedCount: 0,
    lowEditPublishRate: null,
    outcomeScores: [],
    editDistances: [],
    firstSeenAtMs: createdAtMs,
    lastSeenAtMs: createdAtMs,
  };
}

function addSample(aggregate: MutableRankingAggregate, sample: ClassifiedRankingSampleV1) {
  aggregate.sampleSize += 1;
  aggregate.generatedCount += 1;

  if (sample.isMatureLifecycle) aggregate.matureSampleSize += 1;
  if (sample.status === "generated" && sample.isMatureLifecycle) aggregate.staleCount += 1;
  if (sample.status === "accepted") aggregate.acceptedCount += 1;
  if (sample.status === "edited") aggregate.editedCount += 1;
  if (sample.status === "published") aggregate.publishedCount += 1;

  if (sample.isQualifiedRanking && sample.outcomeScore !== null) {
    aggregate.qualifiedSampleSize += 1;
    aggregate.outcomeScores.push(sample.outcomeScore);
  }

  if (sample.isDesignQuality && sample.editDistance !== null) {
    aggregate.designQualitySampleSize += 1;
    aggregate.measuredPublishedCount += 1;
    aggregate.editDistances.push(sample.editDistance);

    if (sample.publishedEditBucket === "low") aggregate.lowEditPublishedCount += 1;
    else if (sample.publishedEditBucket === "medium") aggregate.mediumEditPublishedCount += 1;
    else if (sample.publishedEditBucket === "high") aggregate.highEditPublishedCount += 1;
  }

  const createdAtMs = sample.createdAt.getTime();
  aggregate.firstSeenAtMs = aggregate.firstSeenAtMs === null ? createdAtMs : Math.min(aggregate.firstSeenAtMs, createdAtMs);
  aggregate.lastSeenAtMs = aggregate.lastSeenAtMs === null ? createdAtMs : Math.max(aggregate.lastSeenAtMs, createdAtMs);
}

export function aggregatePatternRankingV1(
  samples: ClassifiedRankingSampleV1[],
  level: DesignPatternRankingV1Level,
): DesignPatternRankingV1[] {
  const aggregates = new Map<string, MutableRankingAggregate>();

  for (const sample of samples) {
    const existing = aggregates.get(sample.levelKeyHash) ?? createAggregate(sample, level);
    addSample(existing, sample);
    aggregates.set(sample.levelKeyHash, existing);
  }

  return [...aggregates.values()].map((aggregate) => {
    const acceptedOrBeyondCount = aggregate.acceptedCount + aggregate.editedCount + aggregate.publishedCount;
    const outcomeScoreSum = stableSum(aggregate.outcomeScores);
    const rankingScore = computeBayesianRankingScoreV1({
      level,
      qualifiedSampleSize: aggregate.qualifiedSampleSize,
      sumQualifiedOutcomeScores: outcomeScoreSum,
    });

    return {
      version: DESIGN_RANKING_V1_VERSION as typeof DESIGN_RANKING_V1_VERSION,
      level,
      patternKey: aggregate.patternKey,
      patternKeyHash: aggregate.patternKeyHash,
      sampleSize: aggregate.sampleSize,
      matureSampleSize: aggregate.matureSampleSize,
      qualifiedSampleSize: aggregate.qualifiedSampleSize,
      designQualitySampleSize: aggregate.designQualitySampleSize,
      generatedCount: aggregate.generatedCount,
      staleCount: aggregate.staleCount,
      acceptedCount: aggregate.acceptedCount,
      editedCount: aggregate.editedCount,
      publishedCount: aggregate.publishedCount,
      measuredPublishedCount: aggregate.measuredPublishedCount,
      acceptRate: rate(acceptedOrBeyondCount, aggregate.matureSampleSize),
      publishRate: rate(aggregate.publishedCount, aggregate.matureSampleSize),
      measuredPublishRate: rate(aggregate.measuredPublishedCount, aggregate.matureSampleSize),
      avgOutcomeScore: average(aggregate.outcomeScores),
      avgEditDistance: average(aggregate.editDistances),
      lowEditPublishedCount: aggregate.lowEditPublishedCount,
      mediumEditPublishedCount: aggregate.mediumEditPublishedCount,
      highEditPublishedCount: aggregate.highEditPublishedCount,
      lowEditPublishRate: rate(aggregate.lowEditPublishedCount, aggregate.measuredPublishedCount),
      rankingScore,
      confidence: confidenceFor(level, aggregate.qualifiedSampleSize),
      firstSeenAt: aggregate.firstSeenAtMs === null ? null : new Date(aggregate.firstSeenAtMs).toISOString(),
      lastSeenAt: aggregate.lastSeenAtMs === null ? null : new Date(aggregate.lastSeenAtMs).toISOString(),
    };
  }).sort(compareDesignPatternRankingV1);
}

function nullableNumberDesc(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function confidenceRank(value: DesignPatternRankingV1Confidence) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

export function compareDesignPatternRankingV1(a: DesignPatternRankingV1, b: DesignPatternRankingV1) {
  return (
    nullableNumberDesc(a.rankingScore, b.rankingScore) ||
    confidenceRank(b.confidence) - confidenceRank(a.confidence) ||
    b.qualifiedSampleSize - a.qualifiedSampleSize ||
    b.publishedCount - a.publishedCount ||
    nullableNumberDesc(a.avgOutcomeScore, b.avgOutcomeScore) ||
    a.patternKeyHash.localeCompare(b.patternKeyHash)
  );
}

export function rankDesignPatternsV1(
  rows: DesignRankingInputV1[],
  level: DesignPatternRankingV1Level,
): DesignPatternRankingV1[] {
  const samples = rows
    .map((row) => classifyRankingSampleV1(row, level))
    .filter((sample): sample is ClassifiedRankingSampleV1 => sample !== null);

  return aggregatePatternRankingV1(samples, level);
}
