import type { ReactNode } from "react"

type EditorBadgeTone = "neutral" | "success" | "warning" | "danger"

interface EditorBadgeProps {
  children: ReactNode
  tone?: EditorBadgeTone
}

const TONE_CLASSES: Record<EditorBadgeTone, string> = {
  neutral: "bg-slate-800 text-slate-300",
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
}

export function EditorBadge({
  children,
  tone = "neutral",
}: EditorBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-bold",
        TONE_CLASSES[tone],
      ].join(" ")}
    >
      {children}
    </span>
  )
}
