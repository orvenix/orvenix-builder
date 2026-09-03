import { editorPrisma } from "@/lib/editor-db"

type AuditLevel = "info" | "warning" | "error" | "security"

export async function audit({
  level = "info",
  module,
  action,
  userId,
  siteId,
  entityType,
  entityId,
  ipAddress,
  userAgent,
  message,
  metadata,
}: {
  level?: AuditLevel
  module: string
  action: string
  userId?: string | null
  siteId?: string | null
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  message: string
  metadata?: unknown
}) {
  try {
    await editorPrisma.auditLog.create({
      data: {
        level,
        module,
        action,
        userId,
        siteId,
        entityType,
        entityId,
        ipAddress,
        userAgent,
        message,
        metadata: metadata === undefined ? undefined : (metadata as never),
      },
    })
  } catch (error) {
    console.error("[audit] failed", error)
  }
}
