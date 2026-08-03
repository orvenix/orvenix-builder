import { editorPrisma } from "@/lib/editor-db"
import {
  hashPassword,
  normalizeRole,
  roleForEmail,
  verifyPassword,
} from "@/lib/auth"

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

export async function runAuthCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  results.push(
    await runCheck(
      "auth.secret",
      "Secreto de autenticación",
      async () => {
        const secret =
          process.env.NEXTAUTH_SECRET ??
          process.env.AUTH_SECRET

        if (!secret) {
          throw new Error(
            "NEXTAUTH_SECRET o AUTH_SECRET no está configurado. Producción no debe usar un secreto por defecto."
          )
        }

        if (secret.length < 32) {
          return {
            status: "warning" as const,
            message:
              "El secreto existe, pero conviene usar uno de al menos 32 caracteres.",
            details: {
              configured: true,
              minimumRecommendedLength: 32,
            },
          }
        }

        return {
          message:
            "El secreto de autenticación está configurado correctamente.",
          details: {
            configured: true,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.url",
      "URL de autenticación",
      async () => {
        const url =
          process.env.NEXTAUTH_URL ??
          process.env.AUTH_URL

        if (!url) {
          throw new Error(
            "NEXTAUTH_URL o AUTH_URL no está configurada."
          )
        }

        let parsed: URL

        try {
          parsed = new URL(url)
        } catch {
          throw new Error(
            "La URL configurada para autenticación no es válida."
          )
        }

        if (
          process.env.NODE_ENV === "production" &&
          parsed.protocol !== "https:"
        ) {
          throw new Error(
            "La URL de autenticación en producción debe usar HTTPS."
          )
        }

        return {
          message:
            `URL de autenticación válida: ${parsed.origin}.`,
          details: {
            origin: parsed.origin,
            https: parsed.protocol === "https:",
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.password-hashing",
      "Hash y verificación de contraseñas",
      async () => {
        const samplePassword =
          "Orvenix-Certification-Password-2026!"

        const hashed = hashPassword(samplePassword)

        if (hashed === samplePassword) {
          throw new Error(
            "El hash devolvió la contraseña en texto plano."
          )
        }

        if (!hashed.includes(":")) {
          throw new Error(
            "El formato del hash no contiene salt y hash separados."
          )
        }

        if (!verifyPassword(samplePassword, hashed)) {
          throw new Error(
            "Una contraseña correcta no pudo verificarse."
          )
        }

        if (
          verifyPassword(
            "contraseña-incorrecta",
            hashed
          )
        ) {
          throw new Error(
            "Una contraseña incorrecta fue aceptada."
          )
        }

        return {
          message:
            "PBKDF2 genera y verifica contraseñas correctamente.",
          details: {
            algorithm: "PBKDF2-SHA512",
            plaintextStored: false,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.user-password-integrity",
      "Integridad de contraseñas almacenadas",
      async () => {
        const users =
          await editorPrisma.user.findMany({
            select: {
              id: true,
              password: true,
            },
          })

        const invalid = users.filter((user) => {
          const [salt, hash] =
            user.password.split(":")

          return (
            !salt ||
            !hash ||
            salt.length !== 32 ||
            hash.length !== 128
          )
        })

        if (invalid.length > 0) {
          throw new Error(
            `${invalid.length} usuarios tienen un formato de contraseña almacenada inválido.`
          )
        }

        return {
          message:
            `Las contraseñas de ${users.length} usuarios tienen formato hash válido.`,
          details: {
            totalUsers: users.length,
            invalidPasswords: 0,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.roles",
      "Roles de usuarios",
      async () => {
        const users =
          await editorPrisma.user.findMany({
            select: {
              email: true,
              role: true,
            },
          })

        const invalid = users.filter(
          (user) =>
            user.role !== "ADMIN" &&
            user.role !== "CLIENT"
        )

        if (invalid.length > 0) {
          throw new Error(
            `${invalid.length} usuarios tienen roles no reconocidos.`
          )
        }

        for (const user of users) {
          const normalized =
            normalizeRole(user.role)

          const resolved =
            roleForEmail(
              user.email,
              user.role
            )

          if (
            normalized !== "ADMIN" &&
            normalized !== "CLIENT"
          ) {
            throw new Error(
              `No se pudo normalizar el rol de ${user.email}.`
            )
          }

          if (
            resolved !== "ADMIN" &&
            resolved !== "CLIENT"
          ) {
            throw new Error(
              `No se pudo resolver el rol de ${user.email}.`
            )
          }
        }

        return {
          message:
            `Los roles de ${users.length} usuarios son válidos.`,
          details: {
            totalUsers: users.length,
            validRoles: [
              "ADMIN",
              "CLIENT",
            ],
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.email-normalization",
      "Normalización de correos",
      async () => {
        const users =
          await editorPrisma.user.findMany({
            select: {
              email: true,
            },
          })

        const nonNormalized =
          users.filter(
            (user) =>
              user.email !==
              user.email.trim().toLowerCase()
          )

        if (nonNormalized.length > 0) {
          return {
            status: "warning" as const,
            message:
              `${nonNormalized.length} usuarios tienen correos no normalizados.`,
            details: {
              totalUsers: users.length,
              nonNormalized:
                nonNormalized.length,
            },
          }
        }

        return {
          message:
            `Los ${users.length} correos de usuarios están normalizados.`,
          details: {
            totalUsers: users.length,
            nonNormalized: 0,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "auth.password-recovery",
      "Recuperación de contraseña",
      async () => {
        if (!process.env.RESEND_API_KEY) {
          return {
            status: "warning" as const,
            message:
              "RESEND_API_KEY no está configurada; no se puede garantizar recuperación por correo.",
            details: {
              resendConfigured: false,
            },
          }
        }

        if (!process.env.RESEND_FROM) {
          return {
            status: "warning" as const,
            message:
              "RESEND_FROM no está configurado; falta remitente para correos de recuperación.",
            details: {
              resendConfigured: true,
              senderConfigured: false,
            },
          }
        }

        return {
          message:
            "La configuración de correo para recuperación de contraseña está disponible.",
          details: {
            resendConfigured: true,
            senderConfigured: true,
          },
        }
      }
    )
  )

  return {
    id: "auth",
    title: "Autenticación",
    results,
  }
}
