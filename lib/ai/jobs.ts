import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { randomUUID } from "crypto"
import { join } from "path"
import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"
import { listSitePages } from "@/lib/builder-core/tree/sitePages"
import { isFileStorageMode } from "@/lib/storage-mode"

export type AIGenerationJobStatus = "queued" | "running" | "completed" | "failed"

export type AIGenerationJobType =
  | "section_generation"
  | "full_page_generation"
  | "copy_edit"
  | "sketch_to_web"
  | "audit_fix"

export interface AIGenerationJobRecord {
  id: string
  siteId: string | null
  pageId: string | null
  type: string
  input: unknown
  output: unknown | null
  status: string
  error: string | null
  createdAt: Date
  updatedAt: Date
}

interface RunAIGenerationJobInput {
  siteId?: string | null
  pageSlug?: string | null
  type: AIGenerationJobType
  input: unknown
}

type DynamicAIGenerationJobDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<AIGenerationJobRecord>
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<AIGenerationJobRecord>
}

interface FileJobStoreEntry {
  id: string
  siteId: string | null
  pageId: string | null
  type: string
  input: unknown
  output: unknown | null
  status: string
  error: string | null
  createdAt: string
  updatedAt: string
}

const SISTEMA_DIR = join(process.cwd(), "sistema")
const AI_JOBS_FILE = join(SISTEMA_DIR, "ai-generation-jobs.json")

function getAIGenerationJobDelegate(): DynamicAIGenerationJobDelegate | null {
  return (editorPrisma as unknown as { aiGenerationJob?: DynamicAIGenerationJobDelegate }).aiGenerationJob ?? null
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return "AI_GENERATION_FAILED"
}

function loadFileStore(): FileJobStoreEntry[] {
  try {
    if (!existsSync(AI_JOBS_FILE)) return []
    return JSON.parse(readFileSync(AI_JOBS_FILE, "utf-8")) as FileJobStoreEntry[]
  } catch {
    return []
  }
}

function saveFileStore(entries: FileJobStoreEntry[]) {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
  writeFileSync(AI_JOBS_FILE, JSON.stringify(entries, null, 2), "utf-8")
}

async function resolvePageId(siteId?: string | null, pageSlug?: string | null) {
  if (!siteId || !pageSlug) return null
  const pages = await listSitePages(siteId)
  return pages.find((page) => page.slug === pageSlug)?.id ?? null
}

async function createJobRecord(input: {
  siteId: string | null
  pageId: string | null
  type: AIGenerationJobType
  payload: unknown
}) {
  const id = randomUUID()
  const now = new Date()
  const delegate = getAIGenerationJobDelegate()

  if (!isFileStorageMode() && delegate) {
    return delegate.create({
      data: {
        id,
        siteId: input.siteId,
        pageId: input.pageId,
        type: input.type,
        input: toJsonValue(input.payload),
        status: "running",
        output: null,
        error: null,
      },
    })
  }

  const entries = loadFileStore()
  entries.unshift({
    id,
    siteId: input.siteId,
    pageId: input.pageId,
    type: input.type,
    input: input.payload,
    output: null,
    status: "running",
    error: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  })
  saveFileStore(entries.slice(0, 200))

  return {
    id,
    siteId: input.siteId,
    pageId: input.pageId,
    type: input.type,
    input: input.payload,
    output: null,
    status: "running",
    error: null,
    createdAt: now,
    updatedAt: now,
  } satisfies AIGenerationJobRecord
}

async function updateJobRecord(
  jobId: string,
  patch: { status: AIGenerationJobStatus; output?: unknown; error?: string | null }
) {
  const delegate = getAIGenerationJobDelegate()

  if (!isFileStorageMode() && delegate) {
    await delegate.update({
      where: { id: jobId },
      data: {
        status: patch.status,
        ...(patch.output !== undefined ? { output: toJsonValue(patch.output) } : {}),
        ...(patch.error !== undefined ? { error: patch.error } : {}),
      },
    })
    return
  }

  const entries = loadFileStore()
  const nextEntries = entries.map((entry) =>
    entry.id === jobId
      ? {
          ...entry,
          status: patch.status,
          output: patch.output !== undefined ? patch.output : entry.output,
          error: patch.error !== undefined ? patch.error : entry.error,
          updatedAt: new Date().toISOString(),
        }
      : entry
  )
  saveFileStore(nextEntries)
}

export async function runAIGenerationJob<T>(
  input: RunAIGenerationJobInput,
  task: () => Promise<T>
): Promise<T> {
  const pageId = await resolvePageId(input.siteId ?? null, input.pageSlug ?? null)
  const job = await createJobRecord({
    siteId: input.siteId ?? null,
    pageId,
    type: input.type,
    payload: input.input,
  })

  try {
    const output = await task()
    await updateJobRecord(job.id, {
      status: "completed",
      output,
      error: null,
    })
    return output
  } catch (error) {
    await updateJobRecord(job.id, {
      status: "failed",
      error: normalizeErrorMessage(error),
    })
    throw error
  }
}
