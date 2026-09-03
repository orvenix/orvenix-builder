import { createHash } from "crypto"

import {
  getEditorTreeFromDb,
  saveEditorTreeToDb,
} from "@/lib/editorPersistence"

import {
  validateTree,
} from "@/types/validateTree"

import {
  validateEditorTreeSafety,
} from "@/lib/orvenix-ai/safety"

import type {
  EditorTree,
} from "@/types/editor"

import type {
  OrvenixAIMutationPlan,
  OrvenixAISnapshot,
} from "./types"

function stableObject(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(stableObject)
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>,
      )
        .sort(([a], [b]) =>
          a.localeCompare(b),
        )
        .map(([key, val]) => [
          key,
          stableObject(val),
        ]),
    )
  }

  return value
}

export function hashEditorTree(
  tree: EditorTree,
): string {
  const json =
    JSON.stringify(
      stableObject(tree),
    )

  return createHash("sha256")
    .update(json)
    .digest("hex")
}

export interface ApplyMutationResult {
  siteId: string
  pageSlug: string
  beforeHash: string
  expectedAfterHash: string
  savedHash: string
  verified: boolean
  safetyScore: number
}

export async function applyMutation(params: {
  plan: OrvenixAIMutationPlan
  pageSlug?: string
}): Promise<ApplyMutationResult> {
  const {
    plan,
    pageSlug = "home",
  } = params

  if (!plan.readyToApply) {
    throw new Error(
      "La mutación no está marcada como lista para aplicar.",
    )
  }

  const safety =
    validateEditorTreeSafety(
      plan.after,
    )

  if (!safety.safe) {
    throw new Error(
      "La mutación fue bloqueada por Safety Validator.",
    )
  }

  /*
   * Releer antes de escribir.
   * Así evitamos aplicar encima de un sitio
   * que cambió después del dry-run.
   */
  const current =
    await getEditorTreeFromDb(
      plan.siteId,
      pageSlug,
    )

  const currentHash =
    hashEditorTree(current)

  const snapshotHash =
    hashEditorTree(
      plan.snapshot.tree,
    )

  if (currentHash !== snapshotHash) {
    throw new Error(
      "El sitio cambió después del snapshot. La mutación fue cancelada.",
    )
  }

  const canonicalAfter =
    validateTree(
      plan.after,
    )

  const expectedAfterHash =
    hashEditorTree(
      canonicalAfter,
    )

  await saveEditorTreeToDb(
    plan.siteId,
    plan.after,
    pageSlug,
  )

  const saved =
    await getEditorTreeFromDb(
      plan.siteId,
      pageSlug,
    )

  const savedHash =
    hashEditorTree(saved)

  return {
    siteId:
      plan.siteId,

    pageSlug,

    beforeHash:
      currentHash,

    expectedAfterHash,

    savedHash,

    verified:
      savedHash ===
      expectedAfterHash,

    safetyScore:
      safety.score,
  }
}

export interface RollbackMutationResult {
  siteId: string
  pageSlug: string
  snapshotHash: string
  restoredHash: string
  verified: boolean
}

export async function rollbackMutation(params: {
  snapshot: OrvenixAISnapshot
  pageSlug?: string
}): Promise<RollbackMutationResult> {
  const {
    snapshot,
    pageSlug = "home",
  } = params

  const safety =
    validateEditorTreeSafety(
      snapshot.tree,
    )

  if (!safety.safe) {
    throw new Error(
      "El snapshot no superó Safety Validator.",
    )
  }

  const snapshotHash =
    hashEditorTree(
      snapshot.tree,
    )

  await saveEditorTreeToDb(
    snapshot.siteId,
    snapshot.tree,
    pageSlug,
  )

  const restored =
    await getEditorTreeFromDb(
      snapshot.siteId,
      pageSlug,
    )

  const restoredHash =
    hashEditorTree(restored)

  return {
    siteId:
      snapshot.siteId,

    pageSlug,

    snapshotHash,

    restoredHash,

    verified:
      snapshotHash ===
      restoredHash,
  }
}
