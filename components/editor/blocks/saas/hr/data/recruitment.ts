export type RecruitStage = "applied" | "screening" | "interview" | "offer" | "hired"

export interface Candidate {
  id: string
  name: string
  role: string
  stage: RecruitStage
  source: string
  appliedDate: string
  score: number
  initials: string
  color: string
}

export const candidates: Candidate[] = [
  { id: "c1", name: "Álvaro Morales",   role: "Senior React Dev", stage: "offer",     source: "LinkedIn",  appliedDate: "2026-04-10", score: 92, initials: "ÁM", color: "#10b981" },
  { id: "c2", name: "Nuria Castillo",   role: "Product Designer", stage: "interview", source: "Referido",  appliedDate: "2026-04-18", score: 88, initials: "NC", color: "#6366f1" },
  { id: "c3", name: "Raúl Jiménez",     role: "Data Engineer",    stage: "interview", source: "Indeed",    appliedDate: "2026-04-20", score: 85, initials: "RJ", color: "#f59e0b" },
  { id: "c4", name: "Celia Vega",       role: "Growth Manager",   stage: "screening", source: "LinkedIn",  appliedDate: "2026-04-25", score: 80, initials: "CV", color: "#ec4899" },
  { id: "c5", name: "Tomás Herrera",    role: "Backend Engineer", stage: "screening", source: "GitHub",    appliedDate: "2026-04-27", score: 78, initials: "TH", color: "#06b6d4" },
  { id: "c6", name: "Valentina Cruz",   role: "Sales Executive",  stage: "applied",   source: "Referido",  appliedDate: "2026-04-29", score: 74, initials: "VC", color: "#8b5cf6" },
  { id: "c7", name: "Ignacio Ramos",    role: "DevOps Lead",      stage: "applied",   source: "LinkedIn",  appliedDate: "2026-05-01", score: 70, initials: "IR", color: "#f97316" },
  { id: "c8", name: "Beatriz Palacios", role: "UX Researcher",    stage: "hired",     source: "Referido",  appliedDate: "2026-04-02", score: 95, initials: "BP", color: "#34d399" },
]

export const stageOrder: RecruitStage[] = ["applied", "screening", "interview", "offer", "hired"]
export const stageLabels: Record<RecruitStage, string> = {
  applied:   "Aplicados",
  screening: "Screening",
  interview: "Entrevista",
  offer:     "Oferta",
  hired:     "Contratados",
}
export const stageColors: Record<RecruitStage, string> = {
  applied:   "#64748b",
  screening: "#f59e0b",
  interview: "#6366f1",
  offer:     "#06b6d4",
  hired:     "#10b981",
}
