import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayStat { date: string; views: number }

export interface SiteAnalytics {
  siteId: string
  totalViews: number
  todayViews: number
  last7Days: number
  last30Days: number
  daily: DayStat[]  // últimos 30 días, ordenados asc
}

// ─── File store ───────────────────────────────────────────────────────────────

const SISTEMA_DIR = join(process.cwd(), "sistema")
const ANALYTICS_FILE = join(SISTEMA_DIR, "analytics.json")

type AnalyticsStore = Record<string, Record<string, number>> // { siteId: { "YYYY-MM-DD": count } }

function loadStore(): AnalyticsStore {
  try {
    if (!existsSync(ANALYTICS_FILE)) return {}
    return JSON.parse(readFileSync(ANALYTICS_FILE, "utf-8")) as AnalyticsStore
  } catch { return {} }
}

function saveStore(store: AnalyticsStore) {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
  writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2), "utf-8")
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function dateRange(days: number): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

// ─── DB table ─────────────────────────────────────────────────────────────────

async function ensureAnalyticsTable() {
  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_analytics (
      id          VARCHAR(64)  NOT NULL,
      siteId      VARCHAR(64)  NOT NULL,
      date        DATE         NOT NULL,
      views       INT          NOT NULL DEFAULT 0,
      createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY analytics_site_date (siteId, date),
      INDEX analytics_siteId_idx (siteId),
      INDEX analytics_date_idx (date)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function trackPageView(siteId: string): Promise<void> {
  const today = todayKey()

  if (isFileStorageMode()) {
    const store = loadStore()
    if (!store[siteId]) store[siteId] = {}
    store[siteId][today] = (store[siteId][today] ?? 0) + 1
    saveStore(store)
    return
  }

  await ensureAnalyticsTable()
  const id = `${siteId}:${today}`
  await editorPrisma.$executeRaw`
    INSERT INTO site_analytics (id, siteId, date, views)
    VALUES (${id}, ${siteId}, ${today}, 1)
    ON DUPLICATE KEY UPDATE views = views + 1
  `
}

export async function getSiteAnalytics(siteId: string): Promise<SiteAnalytics> {
  const last30 = dateRange(30)
  const today = todayKey()
  const last7Start = dateRange(7)[0]

  if (isFileStorageMode()) {
    const store = loadStore()
    const siteDays = store[siteId] ?? {}

    const daily: DayStat[] = last30.map(date => ({
      date,
      views: siteDays[date] ?? 0,
    }))

    const totalViews = Object.values(siteDays).reduce((s, v) => s + v, 0)
    const todayViews = siteDays[today] ?? 0
    const last7Days = daily.slice(-7).reduce((s, d) => s + d.views, 0)
    const last30Days = daily.reduce((s, d) => s + d.views, 0)

    return { siteId, totalViews, todayViews, last7Days, last30Days, daily }
  }

  await ensureAnalyticsTable()

  const rows = await editorPrisma.$queryRaw<{ date: string; views: number }[]>`
    SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, views
    FROM site_analytics
    WHERE siteId = ${siteId}
    ORDER BY date ASC
  `

  const dayMap: Record<string, number> = {}
  for (const row of rows) {
    const key = typeof row.date === "string" ? row.date : new Date(row.date).toISOString().slice(0, 10)
    dayMap[key] = row.views
  }

  const daily: DayStat[] = last30.map(date => ({
    date,
    views: dayMap[date] ?? 0,
  }))

  const totalViews = Object.values(dayMap).reduce((s, v) => s + v, 0)
  const todayViews = dayMap[today] ?? 0
  const last7Days = Object.entries(dayMap)
    .filter(([d]) => d >= last7Start)
    .reduce((s, [, v]) => s + v, 0)
  const last30Days = daily.reduce((s, d) => s + d.views, 0)

  return { siteId, totalViews, todayViews, last7Days, last30Days, daily }
}

export async function getMultiSiteAnalytics(siteIds: string[]): Promise<Record<string, SiteAnalytics>> {
  const results: Record<string, SiteAnalytics> = {}
  await Promise.all(siteIds.map(async id => {
    results[id] = await getSiteAnalytics(id)
  }))
  return results
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
