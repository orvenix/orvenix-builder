import type { ButtonHTMLAttributes, ReactNode } from "react"

interface EditorIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  active?: boolean
}

export function EditorIconButton({
  icon,
  label,
  active = false,
  className = "",
  type = "button",
  ...props
}: EditorIconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-xl",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-slate-950",
        active
          ? "bg-violet-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon}
    </button>
  )
}
