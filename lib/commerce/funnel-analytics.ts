import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"
import type { FunnelStepKind } from "@/lib/commerce/funnels"

type FunnelEventType =
  | "step_view"
  | "checkout_started"
  | "checkout_pending"
  | "checkout_failed"
  | "checkout_success"

interface TrackFunnelEventInput {
  siteId: string
  funnelId: string
  step: FunnelStepKind
  eventType: FunnelEventType
}

export interface FunnelAnalyticsSummary {
  funnelId: string
  stepViews: number
  checkoutStarts: number
  checkoutPending: number
  checkoutFailed: number
  checkoutSuccess: number
  checkoutStartRate: number
  successRateFromViews: number
  successRateFromStarts: number
}

type FileStore = Record<string, Record<string, Record<string, number>>>

const SISTEMA_DIR = join(process.cwd(), "sistema")
const FUNNEL_ANALYTICS_FILE = join(SISTEMA_DIR, "funnel-analytics.json")

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadStore(): FileStore {
  try {
    if (!existsSync(FUNNEL_ANALYTICS_FILE)) return {}
    return JSON.parse(readFileSync(FUNNEL_ANALYTICS_FILE, "utf-8")) as FileStore
  } catch {
    return {}
  }
}

function saveStore(store: FileStore) {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
  writeFileSync(FUNNEL_ANALYTICS_FILE, JSON.stringify(store, null, 2), "utf-8")
}

async function ensureFunnelAnalyticsTable() {
  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS funnel_analytics (
      id          VARCHAR(191) NOT NULL,
      siteId      VARCHAR(64)  NOT NULL,
      funnelId    VARCHAR(191) NOT NULL,
      step        VARCHAR(32)  NOT NULL,
      eventType   VARCHAR(32)  NOT NULL,
      date        DATE         NOT NULL,
      count       INT          NOT NULL DEFAULT 0,
      createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY funnel_analytics_unique (siteId, funnelId, step, eventType, date),
      INDEX funnel_analytics_site_idx (siteId),
      INDEX funnel_analytics_funnel_idx (funnelId),
      INDEX funnel_analytics_date_idx (date)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}

function withDerivedRates(summary: Omit<FunnelAnalyticsSummary, "checkoutStartRate" | "successRateFromViews" | "successRateFromStarts">): FunnelAnalyticsSummary {
  const checkoutStartRate = summary.stepViews > 0
    ? Number(((summary.checkoutStarts / summary.stepViews) * 100).toFixed(1))
    : 0
  const successRateFromViews = summary.stepViews > 0
    ? Number(((summary.checkoutSuccess / summary.stepViews) * 100).toFixed(1))
    : 0
  const successRateFromStarts = summary.checkoutStarts > 0
    ? Number(((summary.checkoutSuccess / summary.checkoutStarts) * 100).toFixed(1))
    : 0

  return {
    ...summary,
    checkoutStartRate,
    successRateFromViews,
    successRateFromStarts,
  }
}

export async function trackFunnelEvent(input: TrackFunnelEventInput): Promise<void> {
  const date = todayKey()

  if (isFileStorageMode()) {
    const store = loadStore()
    store[input.siteId] ??= {}
    store[input.siteId][input.funnelId] ??= {}
    const bucketKey = `${input.step}:${input.eventType}:${date}`
    store[input.siteId][input.funnelId][bucketKey] = (store[input.siteId][input.funnelId][bucketKey] ?? 0) + 1
    saveStore(store)
    return
  }

  await ensureFunnelAnalyticsTable()
  const id = `${input.siteId}:${input.funnelId}:${input.step}:${input.eventType}:${date}`
  await editorPrisma.$executeRaw`
    INSERT INTO funnel_analytics (id, siteId, funnelId, step, eventType, date, count)
    VALUES (${id}, ${input.siteId}, ${input.funnelId}, ${input.step}, ${input.eventType}, ${date}, 1)
    ON DUPLICATE KEY UPDATE count = count + 1
  `
}

export async function getFunnelAnalyticsSummary(siteId: string): Promise<Record<string, FunnelAnalyticsSummary>> {
  if (isFileStorageMode()) {
    const store = loadStore()
    const site = store[siteId] ?? {}
    const summary: Record<string, FunnelAnalyticsSummary> = {}

    for (const [funnelId, metrics] of Object.entries(site)) {
      const base: FunnelAnalyticsSummary = {
        funnelId,
        stepViews: 0,
        checkoutStarts: 0,
        checkoutPending: 0,
        checkoutFailed: 0,
        checkoutSuccess: 0,
        checkoutStartRate: 0,
        successRateFromViews: 0,
        successRateFromStarts: 0,
      }

      for (const [bucketKey, value] of Object.entries(metrics)) {
        const [, eventType] = bucketKey.split(":")
        const count = value ?? 0
        if (eventType === "step_view") base.stepViews += count
        if (eventType === "checkout_started") base.checkoutStarts += count
        if (eventType === "checkout_pending") base.checkoutPending += count
        if (eventType === "checkout_failed") base.checkoutFailed += count
        if (eventType === "checkout_success") base.checkoutSuccess += count
      }

      summary[funnelId] = withDerivedRates(base)
    }

    return summary
  }

  await ensureFunnelAnalyticsTable()
  const rows = await editorPrisma.$queryRaw<Array<{
    funnelId: string
    eventType: FunnelEventType
    total: number
  }>>`
    SELECT funnelId, eventType, SUM(count) as total
    FROM funnel_analytics
    WHERE siteId = ${siteId}
    GROUP BY funnelId, eventType
  `

  const summary: Record<string, FunnelAnalyticsSummary> = {}
  for (const row of rows) {
    summary[row.funnelId] ??= {
      funnelId: row.funnelId,
      stepViews: 0,
      checkoutStarts: 0,
      checkoutPending: 0,
      checkoutFailed: 0,
      checkoutSuccess: 0,
      checkoutStartRate: 0,
      successRateFromViews: 0,
      successRateFromStarts: 0,
    }

    if (row.eventType === "step_view") summary[row.funnelId].stepViews = Number(row.total) || 0
    if (row.eventType === "checkout_started") summary[row.funnelId].checkoutStarts = Number(row.total) || 0
    if (row.eventType === "checkout_pending") summary[row.funnelId].checkoutPending = Number(row.total) || 0
    if (row.eventType === "checkout_failed") summary[row.funnelId].checkoutFailed = Number(row.total) || 0
    if (row.eventType === "checkout_success") summary[row.funnelId].checkoutSuccess = Number(row.total) || 0
  }

  return Object.fromEntries(
    Object.entries(summary).map(([funnelId, data]) => [funnelId, withDerivedRates(data)])
  )
}
