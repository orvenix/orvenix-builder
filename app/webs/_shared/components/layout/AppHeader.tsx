"use client"

import { Search, Bell } from "lucide-react"
import type { AppConfig } from "@/app/webs/_shared/types/common"
import { cn } from "@/app/webs/_shared/lib/cn"
import { Avatar } from "@/app/webs/_shared/components/ui/Avatar"

interface AppHeaderProps {
  config: AppConfig
  /** Left area: breadcrumb, page title, or any node */
  titleSlot?: React.ReactNode
  /** Right area: action buttons */
  actions?: React.ReactNode
  searchPlaceholder?: string
  showSearch?: boolean
  notificationCount?: number
  className?: string
}

export function AppHeader({
  config,
  titleSlot,
  actions,
  searchPlaceholder = "Buscar...",
  showSearch = true,
  notificationCount = 0,
  className,
}: AppHeaderProps) {
  const { theme, user } = config
  const isDark = theme.mode === "dark"

  return (
    <header
      className={cn(
        "min-h-14 flex items-center justify-between gap-2 px-3 py-2 border-b shrink-0 sm:px-6",
        "border-[color:var(--glass-border)]",
        className
      )}
      style={{ backgroundColor: "var(--glass-nav)", backdropFilter: "blur(var(--blur-dropdown))" }}
    >
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {titleSlot}
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--text-muted)]" />
            <input
              placeholder={searchPlaceholder}
              className={cn(
                "motion-glass pl-9 pr-4 py-1.5 text-xs rounded-lg focus:outline-none w-56 lg:w-72 transition-all duration-300",
                isDark
                  ? "bg-white/[0.05] border border-white/[0.07] text-white/60 placeholder:text-white/20 focus:border-[color:var(--glass-border-hover)] focus:bg-white/[0.08]"
                  : "border border-slate-200 bg-white/80 text-slate-600 placeholder:text-slate-300 focus:border-slate-400 focus:shadow-sm"
              )}
              style={isDark ? {} : undefined}
            />
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
        <div className="hidden min-w-0 items-center gap-2 sm:flex">{actions}</div>
        <div className="hidden w-px h-4 bg-white/10 sm:block" />
        <button className="motion-button motion-glass relative w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/10">
          <Bell className="w-4 h-4 text-[color:var(--text-secondary)]" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          )}
        </button>
        {user && <Avatar initials={user.initials} color={user.color} size="sm" />}
      </div>
    </header>
  )
}
