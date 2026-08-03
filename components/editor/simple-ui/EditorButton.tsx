import type { ButtonHTMLAttributes, ReactNode } from "react"

type EditorButtonVariant = "primary" | "secondary" | "ghost" | "danger"

interface EditorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: EditorButtonVariant
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<EditorButtonVariant, string> = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-500 focus-visible:ring-violet-500",
  secondary:
    "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-500",
  ghost:
    "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
}

export function EditorButton({
  children,
  variant = "secondary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: EditorButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4",
        "text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  )
}
