import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

type Job = {
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

type User = { id: string; email: string; name: string | null; password: string }

function cloneMap<T>(map: Map<string, T>) {
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, structuredClone(value)]))
}

function createHarness({ updateFails = false } = {}) {
  const jobs = new Map<string, Job>()
  const users = new Map<string, User>()
  const calls = { emailSends: 0 }

  function matchesWhere(job: Job, where: Record<string, unknown>) {
    if (where.id && typeof where.id === "object" && "in" in where.id) {
      if (!(where.id.in as string[]).includes(job.id)) return false
    } else if (typeof where.id === "string" && job.id !== where.id) {
      return false
    }
    if (typeof where.type === "string" && job.type !== where.type) return false
    if (typeof where.status === "string" && job.status !== where.status) return false
    if (where.status && typeof where.status === "object" && "in" in where.status) {
      if (!(where.status.in as string[]).includes(job.status)) return false
    }
    if (where.createdAt && typeof where.createdAt === "object" && "lt" in where.createdAt) {
      if (!(job.createdAt < (where.createdAt.lt as Date))) return false
    }
    return true
  }

  function tx() {
    return {
      aiGenerationJob: {
        create: async ({ data }: { data: Omit<Job, "createdAt" | "updatedAt"> }) => {
          const now = new Date()
          const job = { ...structuredClone(data), createdAt: now, updatedAt: now }
          jobs.set(job.id, job)
          return job
        },
        findUnique: async ({ where }: { where: { id: string } }) => jobs.get(where.id) ?? null,
        findMany: async ({ where, take }: { where: Record<string, unknown>; take?: number }) => {
          return Array.from(jobs.values()).filter((job) => matchesWhere(job, where)).slice(0, take ?? undefined).map((job) => ({ id: job.id }))
        },
        deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
          let count = 0
          for (const job of Array.from(jobs.values())) {
            if (matchesWhere(job, where)) {
              jobs.delete(job.id)
              count += 1
            }
          }
          return { count }
        },
        updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Job> }) => {
          let count = 0
          for (const job of Array.from(jobs.values())) {
            if (!matchesWhere(job, where)) continue
            jobs.set(job.id, { ...job, ...structuredClone(data), updatedAt: new Date() })
            count += 1
          }
          return { count }
        },
      },
      user: {
        findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.id) return users.get(where.id) ?? null
          return Array.from(users.values()).find((user) => user.email === where.email) ?? null
        },
        update: async ({ where, data }: { where: { id: string }; data: { password: string } }) => {
          if (updateFails) throw new Error("password update failed")
          const user = users.get(where.id)
          if (!user) throw new Error("user not found")
          const updated = { ...user, password: data.password }
          users.set(where.id, updated)
          return updated
        },
      },
    }
  }

  const prisma = {
    aiGenerationJob: tx().aiGenerationJob,
    user: tx().user,
    $transaction: async <T>(callback: (client: ReturnType<typeof tx>) => Promise<T>) => {
      const jobBackup = cloneMap(jobs)
      const userBackup = cloneMap(users)
      try {
        return await callback(tx())
      } catch (error) {
        jobs.clear(); jobBackup.forEach((value, key) => jobs.set(key, value))
        users.clear(); userBackup.forEach((value, key) => users.set(key, value))
        throw error
      }
    },
  }

  return { prisma, jobs, users, calls }
}

async function installHarness(harness: ReturnType<typeof createHarness>) {
  const editorDb = await import("../../lib/editor-db")
  const prisma = editorDb.editorPrisma as unknown as Record<string, unknown>
  prisma.aiGenerationJob = harness.prisma.aiGenerationJob
  prisma.user = harness.prisma.user
  prisma.$transaction = harness.prisma.$transaction
}

function addExpiredJob(service: typeof import("../../lib/reset-tokens"), harness: ReturnType<typeof createHarness>, token: string, userId = "user_1") {
  const id = service.getPasswordResetJobIdForToken(token)
  assert.ok(id)
  harness.jobs.set(id, {
    id,
    siteId: null,
    pageId: null,
    type: service.PASSWORD_RESET_JOB_TYPE,
    input: {
      userId,
      createdAt: new Date(Date.now() - 60_000).toISOString(),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    },
    output: null,
    status: "completed",
    error: null,
    createdAt: new Date(Date.now() - 60_000),
    updatedAt: new Date(Date.now() - 60_000),
  })
}

test("password reset DB almacena solo identificador derivado y nunca el token", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.equal(harness.jobs.size, 1)

  const job = Array.from(harness.jobs.values())[0]
  assert.equal(job.type, service.PASSWORD_RESET_JOB_TYPE)
  assert.equal(job.status, "completed")
  assert.ok(job.id.startsWith("password_reset:"))
  assert.notEqual(job.id.slice("password_reset:".length), token)

  const serialized = JSON.stringify({ input: job.input, output: job.output })
  assert.equal(serialized.includes(token), false)
  assert.deepEqual(Object.keys(job.input as Record<string, unknown>).sort(), ["createdAt", "expiresAt", "userId"])
})

test("token valido cambia contraseña y queda consumed", async () => {
  const harness = createHarness()
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  const result = await service.consumeResetTokenAndUpdatePassword(token, "new-hash")

  assert.equal(result.ok, true)
  assert.equal(harness.users.get("user_1")?.password, "new-hash")
  const job = harness.jobs.get(service.getPasswordResetJobIdForToken(token) ?? "")
  assert.equal(job?.status, "consumed")
})

test("segundo uso del mismo token falla", async () => {
  const harness = createHarness()
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  assert.equal((await service.consumeResetTokenAndUpdatePassword(token, "new-hash")).ok, true)
  assert.equal((await service.consumeResetTokenAndUpdatePassword(token, "other-hash")).ok, false)
  assert.equal(harness.users.get("user_1")?.password, "new-hash")
})

test("token expirado falla", async () => {
  const harness = createHarness()
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")
  const token = "a".repeat(64)
  addExpiredJob(service, harness, token)

  assert.deepEqual(await service.validateResetToken(token), { valid: false })
  assert.equal((await service.consumeResetTokenAndUpdatePassword(token, "new-hash")).ok, false)
  assert.equal(harness.users.get("user_1")?.password, "old")
})

test("token malformado falla sin consultar jobs", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  assert.equal(service.getPasswordResetJobIdForToken("not-valid"), null)
  assert.deepEqual(await service.validateResetToken("not-valid"), { valid: false })
  assert.equal((await service.consumeResetTokenAndUpdatePassword("not-valid", "new-hash")).ok, false)
  assert.equal(harness.jobs.size, 0)
})

test("dos consumos simultaneos permiten solo uno", async () => {
  const harness = createHarness()
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  const results = await Promise.all([
    service.consumeResetTokenAndUpdatePassword(token, "hash-a"),
    service.consumeResetTokenAndUpdatePassword(token, "hash-b"),
  ])

  assert.equal(results.filter((result) => result.ok).length, 1)
  assert.equal(results.filter((result) => !result.ok).length, 1)
  assert.equal(harness.jobs.get(service.getPasswordResetJobIdForToken(token) ?? "")?.status, "consumed")
})

test("error al actualizar password revierte el claim", async () => {
  const harness = createHarness({ updateFails: true })
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  await assert.rejects(() => service.consumeResetTokenAndUpdatePassword(token, "new-hash"))

  assert.equal(harness.users.get("user_1")?.password, "old")
  assert.equal(harness.jobs.get(service.getPasswordResetJobIdForToken(token) ?? "")?.status, "completed")
})

test("reinicio simulado no pierde token persistido", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")

  const token = await service.createResetTokenForUser("user_1")
  await installHarness(harness)

  assert.deepEqual(await service.validateResetToken(token), { valid: true, userId: "user_1" })
})

test("forgot-password no revela si el email existe", async () => {
  const harness = createHarness()
  harness.users.set("user_1", { id: "user_1", email: "cliente@orvenix.test", name: "Cliente", password: "old" })
  await installHarness(harness)
  const route = await import("../../app/api/auth/forgot-password/route")

  const known = await route.POST(new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "cliente@orvenix.test" }),
  }))
  const unknown = await route.POST(new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "nadie@orvenix.test" }),
  }))

  assert.equal(known.status, 200)
  assert.equal(unknown.status, 200)
  assert.deepEqual(await known.json(), await unknown.json())
})

test("jobs password_reset_token no se mezclan con AI undo ni site creation", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/reset-tokens")
  const token = "b".repeat(64)
  const id = service.getPasswordResetJobIdForToken(token)
  assert.ok(id)

  for (const type of ["ai_undo_snapshot", "ai_site_creation_preview"]) {
    harness.jobs.clear()
    harness.jobs.set(id, {
      id,
      siteId: null,
      pageId: null,
      type,
      input: { userId: "user_1", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() },
      output: null,
      status: "completed",
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    assert.deepEqual(await service.validateResetToken(token), { valid: false })
    assert.equal((await service.consumeResetTokenAndUpdatePassword(token, "new-hash")).ok, false)
  }
})
