export type CertificationStatus =
  | "passed"
  | "warning"
  | "failed"

export type CertificationResult = {
  id: string
  title: string
  status: CertificationStatus
  message: string
  durationMs: number
  details?: Record<string, unknown>
}

export type CertificationGroup = {
  id: string
  title: string
  results: CertificationResult[]
}

export type SystemCertificationReport = {
  status: CertificationStatus
  score: number
  passed: number
  warnings: number
  failed: number
  durationMs: number
  generatedAt: string
  groups: CertificationGroup[]
}
