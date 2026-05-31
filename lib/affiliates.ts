import { randomBytes } from "crypto"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AffiliateStatus = "active" | "pending" | "suspended"
export type ReferralStatus = "registered" | "active" | "churned"

export interface Affiliate {
  id: string
  userId: string
  userEmail: string
  userName: string
  code: string
  status: AffiliateStatus
  commissionPct: number
  totalReferrals: number
  activeReferrals: number
  totalEarnedCents: number
  pendingCents: number
  paidCents: number
  paypalEmail: string | null
  bankInfo: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Referral {
  id: string
  affiliateCode: string
  affiliateId: string
  referredEmail: string
  referredUserId: string | null
  status: ReferralStatus
  plan: string | null
  commissionPct: number
  commissionCents: number
  convertedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── File store ───────────────────────────────────────────────────────────────

const SISTEMA_DIR = join(process.cwd(), "sistema")

function ensureDir() {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
}

function loadAffiliates(): Affiliate[] {
  try {
    const file = join(SISTEMA_DIR, "affiliates.json")
    if (!existsSync(file)) return []
    const raw = JSON.parse(readFileSync(file, "utf-8")) as Affiliate[]
    return raw.map(a => ({
      ...a,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    }))
  } catch { return [] }
}

function saveAffiliates(items: Affiliate[]) {
  ensureDir()
  writeFileSync(join(SISTEMA_DIR, "affiliates.json"), JSON.stringify(items, null, 2), "utf-8")
}

function loadReferrals(): Referral[] {
  try {
    const file = join(SISTEMA_DIR, "referrals.json")
    if (!existsSync(file)) return []
    const raw = JSON.parse(readFileSync(file, "utf-8")) as Referral[]
    return raw.map(r => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      convertedAt: r.convertedAt ? new Date(r.convertedAt) : null,
    }))
  } catch { return [] }
}

function saveReferrals(items: Referral[]) {
  ensureDir()
  writeFileSync(join(SISTEMA_DIR, "referrals.json"), JSON.stringify(items, null, 2), "utf-8")
}

function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase() // 8 chars
}

// ─── DB tables ────────────────────────────────────────────────────────────────

async function ensureAffiliateTables() {
  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id VARCHAR(64) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      userEmail VARCHAR(191) NOT NULL,
      userName VARCHAR(191) NOT NULL DEFAULT '',
      code VARCHAR(16) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      commissionPct INT NOT NULL DEFAULT 20,
      totalReferrals INT NOT NULL DEFAULT 0,
      activeReferrals INT NOT NULL DEFAULT 0,
      totalEarnedCents INT NOT NULL DEFAULT 0,
      pendingCents INT NOT NULL DEFAULT 0,
      paidCents INT NOT NULL DEFAULT 0,
      paypalEmail VARCHAR(191) NULL,
      bankInfo TEXT NULL,
      notes TEXT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY affiliates_userId_unique (userId),
      UNIQUE KEY affiliates_code_unique (code),
      INDEX affiliates_status_idx (status)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)

  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS referrals (
      id VARCHAR(64) NOT NULL,
      affiliateCode VARCHAR(16) NOT NULL,
      affiliateId VARCHAR(64) NOT NULL,
      referredEmail VARCHAR(191) NOT NULL,
      referredUserId VARCHAR(191) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'registered',
      plan VARCHAR(64) NULL,
      commissionPct INT NOT NULL DEFAULT 20,
      commissionCents INT NOT NULL DEFAULT 0,
      convertedAt DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX referrals_affiliateId_idx (affiliateId),
      INDEX referrals_affiliateCode_idx (affiliateCode),
      INDEX referrals_referredEmail_idx (referredEmail)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  if (isFileStorageMode()) {
    return loadAffiliates().find(a => a.userId === userId) ?? null
  }
  await ensureAffiliateTables()
  const rows = await editorPrisma.$queryRaw<Affiliate[]>`
    SELECT * FROM affiliates WHERE userId = ${userId} LIMIT 1
  `
  return rows[0] ? hydrateAffiliate(rows[0]) : null
}

export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  if (isFileStorageMode()) {
    return loadAffiliates().find(a => a.code === code.toUpperCase()) ?? null
  }
  await ensureAffiliateTables()
  const upper = code.toUpperCase()
  const rows = await editorPrisma.$queryRaw<Affiliate[]>`
    SELECT * FROM affiliates WHERE code = ${upper} LIMIT 1
  `
  return rows[0] ? hydrateAffiliate(rows[0]) : null
}

export async function createAffiliate({
  userId, userEmail, userName,
}: { userId: string; userEmail: string; userName: string }): Promise<Affiliate> {
  // Idempotente: devuelve existente si ya tiene perfil
  const existing = await getAffiliateByUserId(userId)
  if (existing) return existing

  const id = `aff_${randomBytes(6).toString("hex")}`
  let code = generateCode()

  if (isFileStorageMode()) {
    const all = loadAffiliates()
    while (all.some(a => a.code === code)) code = generateCode()
    const now = new Date()
    const affiliate: Affiliate = {
      id, userId, userEmail, userName, code,
      status: "active", commissionPct: 20,
      totalReferrals: 0, activeReferrals: 0,
      totalEarnedCents: 0, pendingCents: 0, paidCents: 0,
      paypalEmail: null, bankInfo: null, notes: null,
      createdAt: now, updatedAt: now,
    }
    saveAffiliates([...all, affiliate])
    return affiliate
  }

  await ensureAffiliateTables()
  await editorPrisma.$executeRaw`
    INSERT INTO affiliates (id, userId, userEmail, userName, code, status, commissionPct)
    VALUES (${id}, ${userId}, ${userEmail}, ${userName}, ${code}, 'active', 20)
  `
  return (await getAffiliateByUserId(userId))!
}

export async function updateAffiliatePayment(
  userId: string,
  data: { paypalEmail?: string; bankInfo?: string }
): Promise<void> {
  if (isFileStorageMode()) {
    const all = loadAffiliates()
    const idx = all.findIndex(a => a.userId === userId)
    if (idx === -1) return
    all[idx] = { ...all[idx], ...data, updatedAt: new Date() }
    saveAffiliates(all)
    return
  }
  await ensureAffiliateTables()
  if (data.paypalEmail !== undefined) {
    await editorPrisma.$executeRaw`UPDATE affiliates SET paypalEmail = ${data.paypalEmail} WHERE userId = ${userId}`
  }
  if (data.bankInfo !== undefined) {
    await editorPrisma.$executeRaw`UPDATE affiliates SET bankInfo = ${data.bankInfo} WHERE userId = ${userId}`
  }
}

export async function getReferralsByAffiliate(affiliateId: string): Promise<Referral[]> {
  if (isFileStorageMode()) {
    return loadReferrals()
      .filter(r => r.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  await ensureAffiliateTables()
  const rows = await editorPrisma.$queryRaw<Referral[]>`
    SELECT * FROM referrals WHERE affiliateId = ${affiliateId} ORDER BY createdAt DESC LIMIT 100
  `
  return rows.map(hydrateReferral)
}

export async function recordReferral({
  affiliateCode, referredEmail, referredUserId,
}: { affiliateCode: string; referredEmail: string; referredUserId?: string }): Promise<void> {
  const affiliate = await getAffiliateByCode(affiliateCode)
  if (!affiliate || affiliate.status !== "active") return

  // Evitar duplicados por email
  if (isFileStorageMode()) {
    const existing = loadReferrals().find(r => r.referredEmail === referredEmail)
    if (existing) return
    const id = `ref_${randomBytes(6).toString("hex")}`
    const now = new Date()
    const referral: Referral = {
      id, affiliateCode: affiliate.code, affiliateId: affiliate.id,
      referredEmail, referredUserId: referredUserId ?? null,
      status: "registered", plan: null,
      commissionPct: affiliate.commissionPct, commissionCents: 0,
      convertedAt: null, createdAt: now, updatedAt: now,
    }
    const all = loadReferrals()
    saveReferrals([...all, referral])
    // Actualizar contador en affiliate
    const affiliates = loadAffiliates()
    const idx = affiliates.findIndex(a => a.id === affiliate.id)
    if (idx !== -1) {
      affiliates[idx].totalReferrals += 1
      affiliates[idx].updatedAt = now
      saveAffiliates(affiliates)
    }
    return
  }

  await ensureAffiliateTables()
  const existing = await editorPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM referrals WHERE referredEmail = ${referredEmail} LIMIT 1
  `
  if (existing.length > 0) return

  const id = `ref_${randomBytes(6).toString("hex")}`
  await editorPrisma.$executeRaw`
    INSERT INTO referrals (id, affiliateCode, affiliateId, referredEmail, referredUserId, status, commissionPct)
    VALUES (${id}, ${affiliate.code}, ${affiliate.id}, ${referredEmail}, ${referredUserId ?? null}, 'registered', ${affiliate.commissionPct})
  `
  await editorPrisma.$executeRaw`
    UPDATE affiliates SET totalReferrals = totalReferrals + 1 WHERE id = ${affiliate.id}
  `
}

export async function getAllAffiliates(): Promise<Affiliate[]> {
  if (isFileStorageMode()) {
    return loadAffiliates().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  await ensureAffiliateTables()
  const rows = await editorPrisma.$queryRaw<Affiliate[]>`
    SELECT * FROM affiliates ORDER BY createdAt DESC
  `
  return rows.map(hydrateAffiliate)
}

export async function updateAffiliateStatus(id: string, status: AffiliateStatus): Promise<void> {
  if (isFileStorageMode()) {
    const all = loadAffiliates()
    const idx = all.findIndex(a => a.id === id)
    if (idx !== -1) { all[idx].status = status; all[idx].updatedAt = new Date(); saveAffiliates(all) }
    return
  }
  await ensureAffiliateTables()
  await editorPrisma.$executeRaw`UPDATE affiliates SET status = ${status} WHERE id = ${id}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hydrateAffiliate(row: Affiliate): Affiliate {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

function hydrateReferral(row: Referral): Referral {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    convertedAt: row.convertedAt ? new Date(row.convertedAt) : null,
  }
}
