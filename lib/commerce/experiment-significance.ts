export type ExperimentSignificanceResult = {
  significant: boolean
  winner: "A" | "B" | "none"
  pValue: number
  confidenceLevel: number
  chiSquared: number
}

function clampProbability(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1
  const x = Math.abs(value) / Math.sqrt(2)
  const t = 1 / (1 + 0.3275911 * x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1 + sign * erf)
}

export function calculateSignificance(
  aSuccess: number,
  aTotal: number,
  bSuccess: number,
  bTotal: number
): ExperimentSignificanceResult {
  if (aTotal <= 0 || bTotal <= 0) {
    return {
      significant: false,
      winner: "none",
      pValue: 1,
      confidenceLevel: 0,
      chiSquared: 0,
    }
  }

  const aRate = clampProbability(aSuccess / aTotal)
  const bRate = clampProbability(bSuccess / bTotal)
  const pooled = clampProbability((aSuccess + bSuccess) / (aTotal + bTotal))
  const standardError = Math.sqrt(pooled * (1 - pooled) * ((1 / aTotal) + (1 / bTotal)))

  if (standardError === 0) {
    return {
      significant: false,
      winner: "none",
      pValue: 1,
      confidenceLevel: 0,
      chiSquared: 0,
    }
  }

  const zScore = (aRate - bRate) / standardError
  const pValue = clampProbability(2 * (1 - normalCdf(Math.abs(zScore))))
  const chiSquared = Math.max(0, zScore * zScore)
  const significant = pValue < 0.05

  return {
    significant,
    winner: significant ? (aRate > bRate ? "A" : "B") : "none",
    pValue,
    confidenceLevel: Math.max(0, (1 - pValue) * 100),
    chiSquared,
  }
}
