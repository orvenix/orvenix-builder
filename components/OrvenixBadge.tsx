import Link from "next/link"

interface OrvenixBadgeProps {
  /** "demo" = "Diseñado con Orvenix" · "powered" = "Potenciado por Orvenix" */
  variant?: "demo" | "powered"
  className?: string
}

export function OrvenixBadge({ variant = "demo", className = "" }: OrvenixBadgeProps) {
  const label = variant === "powered" ? "Potenciado por" : "Diseñado con"
  return (
    <div className={`flex items-center justify-center gap-1.5 py-2 text-[11px] text-white/20 ${className}`}>
      <span>{label}</span>
      <Link
        href="https://orvenix.com.mx"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-white/35 hover:text-white/60 transition-colors"
      >
        Orvenix
      </Link>
    </div>
  )
}
