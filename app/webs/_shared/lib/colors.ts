export const COLOR_KEYS = [
  "violet", "blue", "emerald", "amber", "red",
  "cyan", "indigo", "orange", "teal", "pink", "slate",
] as const

export type ColorKey = (typeof COLOR_KEYS)[number]

export interface ColorStyle {
  text: string       // e.g. "text-violet-400"
  textMuted: string  // e.g. "text-violet-300"
  bg: string         // subtle fill — e.g. "bg-violet-500/20"
  bgSolid: string    // solid fill  — e.g. "bg-violet-600"
  border: string     // e.g. "border-violet-500/30"
  gradient: string   // Tailwind gradient — e.g. "from-violet-600 to-purple-700"
}

export const colorStyles: Record<ColorKey, ColorStyle> = {
  violet:  { text: "text-violet-400",  textMuted: "text-violet-300",  bg: "bg-violet-500/20",  bgSolid: "bg-violet-600",  border: "border-violet-500/30",  gradient: "from-violet-600 to-purple-700" },
  blue:    { text: "text-blue-400",    textMuted: "text-blue-300",    bg: "bg-blue-500/20",    bgSolid: "bg-blue-600",    border: "border-blue-500/30",    gradient: "from-blue-600 to-cyan-600" },
  emerald: { text: "text-emerald-400", textMuted: "text-emerald-300", bg: "bg-emerald-500/20", bgSolid: "bg-emerald-600", border: "border-emerald-500/30", gradient: "from-emerald-600 to-teal-600" },
  amber:   { text: "text-amber-400",   textMuted: "text-amber-300",   bg: "bg-amber-500/20",   bgSolid: "bg-amber-500",   border: "border-amber-500/30",   gradient: "from-amber-500 to-orange-600" },
  red:     { text: "text-red-400",     textMuted: "text-red-300",     bg: "bg-red-500/20",     bgSolid: "bg-red-600",     border: "border-red-500/30",     gradient: "from-red-600 to-rose-600" },
  cyan:    { text: "text-cyan-400",    textMuted: "text-cyan-300",    bg: "bg-cyan-500/20",    bgSolid: "bg-cyan-600",    border: "border-cyan-500/30",    gradient: "from-cyan-600 to-blue-600" },
  indigo:  { text: "text-indigo-400",  textMuted: "text-indigo-300",  bg: "bg-indigo-500/20",  bgSolid: "bg-indigo-600",  border: "border-indigo-500/30",  gradient: "from-indigo-600 to-violet-600" },
  orange:  { text: "text-orange-400",  textMuted: "text-orange-300",  bg: "bg-orange-500/20",  bgSolid: "bg-orange-500",  border: "border-orange-500/30",  gradient: "from-orange-500 to-red-500" },
  teal:    { text: "text-teal-400",    textMuted: "text-teal-300",    bg: "bg-teal-500/20",    bgSolid: "bg-teal-600",    border: "border-teal-500/30",    gradient: "from-teal-600 to-cyan-600" },
  pink:    { text: "text-pink-400",    textMuted: "text-pink-300",    bg: "bg-pink-500/20",    bgSolid: "bg-pink-600",    border: "border-pink-500/30",    gradient: "from-pink-600 to-rose-600" },
  slate:   { text: "text-slate-400",   textMuted: "text-slate-300",   bg: "bg-slate-500/20",   bgSolid: "bg-slate-500",   border: "border-slate-500/30",   gradient: "from-slate-600 to-slate-700" },
}

/** Hex values for contexts that require CSS colors (SVG attributes, box-shadow, etc.) */
export const colorHex: Record<ColorKey, string> = {
  violet:  "#7c3aed",
  blue:    "#2563eb",
  emerald: "#10b981",
  amber:   "#f59e0b",
  red:     "#ef4444",
  cyan:    "#06b6d4",
  indigo:  "#6366f1",
  orange:  "#f97316",
  teal:    "#14b8a6",
  pink:    "#ec4899",
  slate:   "#64748b",
}

/** Cycle through colors deterministically by index */
export function colorByIndex(index: number): ColorKey {
  return COLOR_KEYS[index % COLOR_KEYS.length]
}
