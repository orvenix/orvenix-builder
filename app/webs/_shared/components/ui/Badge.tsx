import { cn } from "@/app/webs/_shared/lib/cn"

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral"

const variantStyles: Record<BadgeVariant, { light: string; dark: string }> = {
  default:  { light: "bg-slate-100 text-slate-600 border-slate-200",       dark: "bg-white/10 text-white/60 border-white/10" },
  success:  { light: "bg-emerald-50 text-emerald-600 border-emerald-200",  dark: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  warning:  { light: "bg-amber-50 text-amber-600 border-amber-200",        dark: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  danger:   { light: "bg-red-50 text-red-500 border-red-200",              dark: "bg-red-500/20 text-red-400 border-red-500/30" },
  info:     { light: "bg-blue-50 text-blue-600 border-blue-200",           dark: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  neutral:  { light: "bg-slate-100 text-slate-500 border-slate-200",       dark: "bg-white/[0.06] text-white/40 border-white/10" },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  /** Custom hex color — overrides variant styles */
  color?: string
  size?: "sm" | "md"
  mode?: "light" | "dark"
  className?: string
}

export function Badge({
  children,
  variant = "default",
  color,
  size = "sm",
  mode = "light",
  className,
}: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
  const variantClass = variantStyles[variant][mode]

  if (color) {
    return (
      <span
        className={cn("inline-flex items-center font-semibold rounded-full border", sizeClass, className)}
        style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
      >
        {children}
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center font-semibold rounded-full border", sizeClass, variantClass, className)}>
      {children}
    </span>
  )
}
