import { runDatabaseCertification } from "./database"
import { runStripeCertification } from "./stripe"
import { runMercadoPagoCertification } from "./mercadopago"
import { runAuthCertification } from "./auth"
import { runStorageCertification } from "./storage"
import { runBuilderCertification } from "./builder"

import type {
  CertificationGroup,
  CertificationStatus,
  SystemCertificationReport,
} from "./types"

function reportStatus(
  failed: number,
  warnings: number
): CertificationStatus {
  if (failed > 0) return "failed"
  if (warnings > 0) return "warning"
  return "passed"
}

export async function runSystemCertification(): Promise<SystemCertificationReport> {
  const startedAt = Date.now()

  const groups: CertificationGroup[] = [
    await runDatabaseCertification(),
    await runStripeCertification(),
    await runMercadoPagoCertification(),
    await runAuthCertification(),
    await runStorageCertification(),
    await runBuilderCertification(),
  ]

  const results = groups.flatMap(
    (group) => group.results
  )

  const passed = results.filter(
    (result) => result.status === "passed"
  ).length

  const warnings = results.filter(
    (result) => result.status === "warning"
  ).length

  const failed = results.filter(
    (result) => result.status === "failed"
  ).length

  const total = results.length
  const score =
    total === 0
      ? 0
      : Math.round(
          ((passed + warnings * 0.5) / total) * 100
        )

  return {
    status: reportStatus(failed, warnings),
    score,
    passed,
    warnings,
    failed,
    durationMs: Date.now() - startedAt,
    generatedAt: new Date().toISOString(),
    groups,
  }
}
