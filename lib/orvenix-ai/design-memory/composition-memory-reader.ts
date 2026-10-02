import { editorPrisma } from "@/lib/editor-db"

import { COMPOSITION_MEMORY_LIMITS_V1, deriveCompositionMemoryV1, emptyCompositionMemoryV1, type CompositionMemoryRecordV1, type CompositionMemoryV1 } from "./composition-memory"

/**
 * CF-4C: READ-ONLY, owner-scoped, bounded reader of the owner's recent
 * DesignGeneration rows (newest first, at most maxGenerations, weighted
 * statuses only). Fail-open: any error yields empty memory -- generation
 * never depends on Design Memory being readable.
 */

export const COMPOSITION_MEMORY_STATUSES_V1 = ["published", "edited", "accepted", "generated"] as const

type CompositionMemoryRow = {
  userId: string
  status: string
  initialPlan: unknown
  editMetrics: unknown
  createdAt: Date
}

export type CompositionMemoryReaderClient = {
  designGeneration: {
    findMany(args: {
      where: { userId: string; status: { in: string[] } }
      orderBy: { createdAt: "desc" }
      take: number
      select: { userId: true; status: true; initialPlan: true; editMetrics: true; createdAt: true }
    }): Promise<CompositionMemoryRow[]>
  }
}

export async function readRecentCompositionMemoryV1(
  input: { userId: string },
  client: CompositionMemoryReaderClient = editorPrisma as unknown as CompositionMemoryReaderClient,
): Promise<CompositionMemoryV1> {
  const userId = typeof input.userId === "string" ? input.userId.trim() : ""
  if (!userId) return emptyCompositionMemoryV1()
  try {
    const rows = await client.designGeneration.findMany({
      where: { userId, status: { in: [...COMPOSITION_MEMORY_STATUSES_V1] } },
      orderBy: { createdAt: "desc" },
      take: COMPOSITION_MEMORY_LIMITS_V1.maxGenerations,
      select: { userId: true, status: true, initialPlan: true, editMetrics: true, createdAt: true },
    })
    const records: CompositionMemoryRecordV1[] = rows.map((row) => ({ userId: row.userId, status: row.status, initialPlan: row.initialPlan, editMetrics: row.editMetrics, createdAt: row.createdAt }))
    return deriveCompositionMemoryV1(records, { ownerUserId: userId })
  } catch {
    return emptyCompositionMemoryV1()
  }
}
