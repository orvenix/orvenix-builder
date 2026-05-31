import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"

type ExperimentVariant = "A" | "B"
type ExperimentEventType = "assignment" | "checkout_started" | "checkout_success"

interface TrackExperimentEventInput {
  siteId: string
  experimentId: string
  variant: ExperimentVariant
  eventType: ExperimentEventType
}

export interface ExperimentAnalyticsSummary {
  experimentId: string
  assignmentsA: number
  assignmentsB: number
  checkoutStartsA: number
  checkoutStartsB: number
  checkoutSuccessA: number
  checkoutSuccessB: number
  totalAssignments: number
  totalCheckoutStarts: number
  totalCheckoutSuccess: number
  checkoutStartRate: number
  successRateFromAssignments: number
  successRateFromStarts: number
}

type FileStore = Record<string, Record<string, Record<string, number>>>

const SISTEMA_DIR = join(process.cwd(), "sistema")
const EXPERIMENT_ANALYTICS_FILE = join(SISTEMA_DIR, "experiment-analytics.json")

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadStore(): FileStore {
  try {
    if (!existsSync(EXPERIMENT_ANALYTICS_FILE)) return {}
    return JSON.parse(readFileSync(EXPERIMENT_ANALYTICS_FILE, "utf-8")) as FileStore
  } catch {
    return {}
  }
}

function saveStore(store: FileStore) {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
  writeFileSync(EXPERIMENT_ANALYTICS_FILE, JSON.stringify(store, null, 2), "utf-8")
}

async function ensureExperimentAnalyticsTable() {
  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS experiment_analytics (
      id          VARCHAR(191) NOT NULL,
      siteId      VARCHAR(64)  NOT NULL,
      experimentId VARCHAR(191) NOT NULL,
      variant     VARCHAR(8)   NOT NULL,
      eventType   VARCHAR(32)  NOT NULL,
      date        DATE         NOT NULL,
      count       INT          NOT NULL DEFAULT 0,
      createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY experiment_analytics_unique (siteId, experimentId, variant, eventType, date),
      INDEX experiment_analytics_site_idx (siteId),
      INDEX experiment_analytics_experiment_idx (experimentId),
      INDEX experiment_analytics_date_idx (date)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}

function withDerivedRates(summary: Omit<ExperimentAnalyticsSummary, "checkoutStartRate" | "successRateFromAssignments" | "successRateFromStarts">): ExperimentAnalyticsSummary {
  const checkoutStartRate = summary.totalAssignments > 0
    ? Number(((summary.totalCheckoutStarts / summary.totalAssignments) * 100).toFixed(1))
    : 0
  const successRateFromAssignments = summary.totalAssignments > 0
    ? Number(((summary.totalCheckoutSuccess / summary.totalAssignments) * 100).toFixed(1))
    : 0
  const successRateFromStarts = summary.totalCheckoutStarts > 0
    ? Number(((summary.totalCheckoutSuccess / summary.totalCheckoutStarts) * 100).toFixed(1))
    : 0

  return {
    ...summary,
    checkoutStartRate,
    successRateFromAssignments,
    successRateFromStarts,
  }
}

export async function trackExperimentEvent(input: TrackExperimentEventInput): Promise<void> {
  const date = todayKey()

  if (isFileStorageMode()) {
    const store = loadStore()
    store[input.siteId] ??= {}
    store[input.siteId][input.experimentId] ??= {}
    const bucketKey = `${input.variant}:${input.eventType}:${date}`
    store[input.siteId][input.experimentId][bucketKey] = (store[input.siteId][input.experimentId][bucketKey] ?? 0) + 1
    saveStore(store)
    return
  }

  await ensureExperimentAnalyticsTable()
  const id = `${input.siteId}:${input.experimentId}:${input.variant}:${input.eventType}:${date}`
  await editorPrisma.$executeRaw`
    INSERT INTO experiment_analytics (id, siteId, experimentId, variant, eventType, date, count)
    VALUES (${id}, ${input.siteId}, ${input.experimentId}, ${input.variant}, ${input.eventType}, ${date}, 1)
    ON DUPLICATE KEY UPDATE count = count + 1
  `
}

export async function getExperimentAnalyticsSummary(siteId: string): Promise<Record<string, ExperimentAnalyticsSummary>> {
  if (isFileStorageMode()) {
    const store = loadStore()
    const site = store[siteId] ?? {}
    const summary: Record<string, ExperimentAnalyticsSummary> = {}

    for (const [experimentId, metrics] of Object.entries(site)) {
      const base = {
        experimentId,
        assignmentsA: 0,
        assignmentsB: 0,
        checkoutStartsA: 0,
        checkoutStartsB: 0,
        checkoutSuccessA: 0,
        checkoutSuccessB: 0,
        totalAssignments: 0,
        totalCheckoutStarts: 0,
        totalCheckoutSuccess: 0,
      }

      for (const [bucketKey, count] of Object.entries(metrics)) {
        const [variant, eventType] = bucketKey.split(":")
        const total = count ?? 0
        if (variant === "A" && eventType === "assignment") base.assignmentsA += total
        if (variant === "B" && eventType === "assignment") base.assignmentsB += total
        if (variant === "A" && eventType === "checkout_started") base.checkoutStartsA += total
        if (variant === "B" && eventType === "checkout_started") base.checkoutStartsB += total
        if (variant === "A" && eventType === "checkout_success") base.checkoutSuccessA += total
        if (variant === "B" && eventType === "checkout_success") base.checkoutSuccessB += total
      }

      base.totalAssignments = base.assignmentsA + base.assignmentsB
      base.totalCheckoutStarts = base.checkoutStartsA + base.checkoutStartsB
      base.totalCheckoutSuccess = base.checkoutSuccessA + base.checkoutSuccessB
      summary[experimentId] = withDerivedRates(base)
    }

    return summary
  }

  await ensureExperimentAnalyticsTable()
  const rows = await editorPrisma.$queryRaw<Array<{
    experimentId: string
    variant: ExperimentVariant
    eventType: ExperimentEventType
    total: number
  }>>`
    SELECT experimentId, variant, eventType, SUM(count) as total
    FROM experiment_analytics
    WHERE siteId = ${siteId}
    GROUP BY experimentId, variant, eventType
  `

  const summary: Record<string, ExperimentAnalyticsSummary> = {}
  for (const row of rows) {
    summary[row.experimentId] ??= {
      experimentId: row.experimentId,
      assignmentsA: 0,
      assignmentsB: 0,
      checkoutStartsA: 0,
      checkoutStartsB: 0,
      checkoutSuccessA: 0,
      checkoutSuccessB: 0,
      totalAssignments: 0,
      totalCheckoutStarts: 0,
      totalCheckoutSuccess: 0,
      checkoutStartRate: 0,
      successRateFromAssignments: 0,
      successRateFromStarts: 0,
    }

    const target = summary[row.experimentId]
    const total = Number(row.total) || 0
    if (row.variant === "A" && row.eventType === "assignment") target.assignmentsA += total
    if (row.variant === "B" && row.eventType === "assignment") target.assignmentsB += total
    if (row.variant === "A" && row.eventType === "checkout_started") target.checkoutStartsA += total
    if (row.variant === "B" && row.eventType === "checkout_started") target.checkoutStartsB += total
    if (row.variant === "A" && row.eventType === "checkout_success") target.checkoutSuccessA += total
    if (row.variant === "B" && row.eventType === "checkout_success") target.checkoutSuccessB += total
  }

  for (const experimentId of Object.keys(summary)) {
    const current = summary[experimentId]
    current.totalAssignments = current.assignmentsA + current.assignmentsB
    current.totalCheckoutStarts = current.checkoutStartsA + current.checkoutStartsB
    current.totalCheckoutSuccess = current.checkoutSuccessA + current.checkoutSuccessB
    summary[experimentId] = withDerivedRates(current)
  }

  return summary
}
