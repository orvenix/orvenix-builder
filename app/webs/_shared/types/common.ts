import type { LucideIcon } from "lucide-react"

// ─── Navigation ────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  badge?: string
  active?: boolean
}

// ─── Theme ─────────────────────────────────────────────────────────────────────

export interface AppTheme {
  mode: "dark" | "light"
  accent: string         // hex color — e.g. "#7c3aed"
  gradient: string       // Tailwind gradient — e.g. "from-violet-600 to-purple-800"
  bgPrimary: string      // CSS color string for main bg
  bgSidebar: string      // CSS color string for sidebar bg
}

// ─── User ──────────────────────────────────────────────────────────────────────

export interface AppUser {
  name: string
  role: string
  initials: string
  color: string  // hex
}

// ─── App config (drives sidebar + header) ──────────────────────────────────────

export interface AppConfig {
  name: string
  logoInitial: string
  theme: AppTheme
  nav: NavItem[]
  bottomNav?: NavItem[]
  user?: AppUser
  backHref?: string       // href for "back to hub" link
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export interface StatItem {
  label: string
  value: string
  change: string
  positive: boolean
  icon: LucideIcon
  accent: string
  sparkline?: number[]
}

// ─── Generic select option ─────────────────────────────────────────────────────

export interface SelectOption<T extends string = string> {
  label: string
  value: T
}
