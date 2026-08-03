import {
  access,
  mkdir,
  writeFile,
  readFile,
  unlink,
  lstat,
  realpath,
} from "fs/promises"

import { constants } from "fs"
import { join } from "path"
import { randomBytes } from "crypto"

import { getStorageMode } from "@/lib/storage-mode"
import {
  ALLOWED_TYPES,
  MAX_SIZE_BYTES,
} from "@/lib/upload-policy"

import type {
  CertificationGroup,
  CertificationResult,
} from "./types"

async function runCheck(
  id: string,
  title: string,
  callback: () => Promise<{
    status?: "passed" | "warning"
    message: string
    details?: Record<string, unknown>
  }>
): Promise<CertificationResult> {
  const startedAt = Date.now()

  try {
    const result = await callback()

    return {
      id,
      title,
      status: result.status ?? "passed",
      message: result.message,
      durationMs: Date.now() - startedAt,
      details: result.details,
    }
  } catch (error) {
    return {
      id,
      title,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : String(error),
      durationMs: Date.now() - startedAt,
    }
  }
}

export async function runStorageCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  const uploadDir = join(
    process.cwd(),
    "public",
    "uploads"
  )

  results.push(
    await runCheck(
      "storage.data-mode",
      "Persistencia de datos",
      async () => {
        const mode = getStorageMode()

        if (
          process.env.NODE_ENV === "production" &&
          mode !== "prisma"
        ) {
          throw new Error(
            `ORVENIX_STORAGE_MODE=${mode}. Producción debe usar Prisma/MariaDB para datos persistentes.`
          )
        }

        return {
          message:
            mode === "prisma"
              ? "Los datos persistentes utilizan Prisma/MariaDB."
              : `El almacenamiento de datos está en modo ${mode}.`,
          details: {
            mode,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "storage.upload-directory",
      "Directorio de uploads",
      async () => {
        await mkdir(uploadDir, {
          recursive: true,
        })

        await access(
          uploadDir,
          constants.R_OK | constants.W_OK
        )

        return {
          message:
            "public/uploads existe y el proceso tiene permisos de lectura y escritura.",
          details: {
            path: "public/uploads",
            readable: true,
            writable: true,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "storage.read-write",
      "Escritura y lectura de archivos",
      async () => {
        const testName =
          `.orvenix-cert-${Date.now()}-${randomBytes(4).toString("hex")}.tmp`

        const testPath = join(
          uploadDir,
          testName
        )

        const expected =
          `orvenix-storage-certification-${randomBytes(8).toString("hex")}`

        try {
          await writeFile(
            testPath,
            expected,
            "utf8"
          )

          const actual =
            await readFile(
              testPath,
              "utf8"
            )

          if (actual !== expected) {
            throw new Error(
              "El contenido leído no coincide con el contenido escrito."
            )
          }

          return {
            message:
              "El servidor puede escribir y leer correctamente en public/uploads.",
            details: {
              write: true,
              read: true,
            },
          }
        } finally {
          await unlink(
            testPath
          ).catch(() => undefined)
        }
      }
    )
  )

  results.push(
    await runCheck(
      "storage.upload-security",
      "Política de archivos subidos",
      async () => {
        const dangerousTypes = [
          "image/svg+xml",
          "text/html",
          "application/javascript",
          "text/javascript",
        ]

        const allowedDangerousTypes =
          dangerousTypes.filter((type) =>
            ALLOWED_TYPES.includes(type)
          )

        if (
          allowedDangerousTypes.length > 0
        ) {
          throw new Error(
            `Existen tipos de archivo potencialmente activos permitidos: ${allowedDangerousTypes.join(", ")}.`
          )
        }

        if (
          MAX_SIZE_BYTES >
          5 * 1024 * 1024
        ) {
          return {
            status: "warning" as const,
            message:
              "El límite máximo de upload supera los 5 MB recomendados actualmente.",
            details: {
              maxSizeMb:
                MAX_SIZE_BYTES /
                1024 /
                1024,
            },
          }
        }

        return {
          message:
            "La política de uploads bloquea formatos activos y mantiene el límite máximo en 5 MB.",
          details: {
            maxSizeMb:
              MAX_SIZE_BYTES /
              1024 /
              1024,
            authenticationRequired: true,
            svgAllowed:
              ALLOWED_TYPES.includes(
                "image/svg+xml"
              ),
            allowedTypes:
              ALLOWED_TYPES,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "storage.persistence",
      "Persistencia de imágenes",
      async () => {
        const stats =
          await lstat(uploadDir)

        if (!stats.isSymbolicLink()) {
          return {
            status: "warning" as const,
            message:
              "public/uploads no es un enlace simbólico hacia almacenamiento persistente.",
            details: {
              path: "public/uploads",
              symbolicLink: false,
              persistenceVerified: false,
            },
          }
        }

        const resolvedPath =
          await realpath(uploadDir)

        const expectedPath =
          "/var/lib/orvenix/uploads"

        if (
          resolvedPath !== expectedPath
        ) {
          return {
            status: "warning" as const,
            message:
              `public/uploads apunta a ${resolvedPath}, no a ${expectedPath}.`,
            details: {
              path: "public/uploads",
              resolvedPath,
              expectedPath,
              persistenceVerified: false,
            },
          }
        }

        await access(
          resolvedPath,
          constants.R_OK |
            constants.W_OK
        )

        return {
          message:
            "Las imágenes utilizan almacenamiento persistente fuera del directorio de despliegue.",
          details: {
            path: "public/uploads",
            resolvedPath,
            symbolicLink: true,
            readable: true,
            writable: true,
            persistenceVerified: true,
          },
        }
      }
    )
  )

  return {
    id: "storage",
    title: "Storage / Uploads",
    results,
  }
}
