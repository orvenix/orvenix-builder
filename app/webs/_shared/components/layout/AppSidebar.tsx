"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import type { AppConfig } from "@/app/webs/_shared/types/common"
import { cn } from "@/app/webs/_shared/lib/cn"
import { Avatar } from "@/app/webs/_shared/components/ui/Avatar"
import { OrvenixIcon } from "@/components/OrvenixLogo"

interface AppSidebarProps {
  config: AppConfig
  collapsed: boolean
  onToggle: () => void
  /** Optional slot rendered above nav items */
  topSlot?: React.ReactNode
}

export function AppSidebar({ config, collapsed, onToggle, topSlot }: AppSidebarProps) {
  const { theme, nav, bottomNav, user, name, backHref = "/webs" } = config
  const isDark = theme.mode === "dark"

  const s = {
    root:            "border-[color:var(--glass-border)]",
    divider:         "border-[color:var(--glass-border)]",
    label:           isDark ? "text-white/25"        : "text-slate-400",
    item:            isDark ? "text-white/40 hover:text-white/80 hover:bg-white/[0.05]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
    toggleBtn:       "bg-white/[0.06] hover:bg-white/10",
    toggleIcon:      isDark ? "text-white/50"        : "text-slate-400",
    userName:        isDark ? "text-white/80"         : "text-slate-700",
    userRole:        isDark ? "text-white/30"         : "text-slate-400",
  }

  return (
    <aside
      className={cn(
        "motion-glass flex flex-col h-full border-r transition-all duration-300 shrink-0",
        s.root,
        collapsed ? "w-14 sm:w-16" : "w-56"
      )}
      style={{ backgroundColor: "var(--glass-nav)", backdropFilter: "blur(var(--blur-nav))" }}
    >
      {/* Logo row */}
      <div className={cn("h-14 flex items-center justify-between px-3 sm:px-4 border-b shrink-0", s.divider)}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
          <OrvenixIcon size={collapsed ? 27 : 30} className="shrink-0 drop-shadow-[0_0_15px_rgba(0,181,246,0.4)]" />
          {!collapsed && (
            <span className={cn("font-bold text-sm tracking-normal truncate", isDark ? "text-white" : "text-slate-800")}>
              {name}
            </span>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} className={cn("motion-button w-6 h-6 rounded-md flex items-center justify-center shrink-0", s.toggleBtn)}>
            <ChevronLeft className={cn("w-3 h-3", s.toggleIcon)} />
          </button>
        )}
      </div>

      {/* Optional top slot (e.g. sprint summary, store status) */}
      {!collapsed && topSlot && (
        <div className="px-3 pt-3">{topSlot}</div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-1.5 sm:px-2 overflow-y-auto space-y-0.5">
        {!collapsed && (
          <p className={cn("text-[10px] font-bold uppercase tracking-widest px-2 mb-2", s.label)}>
            Principal
          </p>
        )}
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "motion-button flex items-center gap-3 px-2 py-2 rounded-lg text-sm",
                collapsed ? "justify-center" : "",
                item.active
                  ? isDark
                    ? "text-white bg-white/[0.07]"
                    : "font-semibold"
                  : s.item
              )}
              style={item.active ? { color: "var(--accent)", backgroundColor: "rgba(56, 189, 248, 0.10)" } : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={item.active ? { color: "var(--accent)" } : undefined}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav + user */}
      <div className={cn("pb-3 border-t px-2 pt-3 shrink-0", s.divider)}>
        {bottomNav?.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn("motion-button flex items-center gap-3 px-2 py-2 rounded-lg text-sm", collapsed ? "justify-center" : "", s.item)}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center text-white font-bold" style={{ backgroundColor: "var(--accent)" }}>
                    {item.badge}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* Back to hub */}
        <Link
          href={backHref}
          className={cn("motion-button flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs", collapsed ? "justify-center" : "", isDark ? "text-white/20 hover:text-white/50" : "text-slate-300 hover:text-slate-500")}
          title={collapsed ? "Volver al Hub" : undefined}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && "Volver al Hub"}
        </Link>

        {/* User */}
        {user && (
          <div className={cn("flex items-center gap-3 px-2 py-2 mt-1 rounded-lg", collapsed && "justify-center")}>
            <Avatar initials={user.initials} color={user.color} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-semibold truncate", s.userName)}>{user.name}</div>
                <div className={cn("text-[10px] truncate", s.userRole)}>{user.role}</div>
              </div>
            )}
          </div>
        )}

        {/* Expand toggle when collapsed */}
        {collapsed && (
          <button
            onClick={onToggle}
            className={cn("motion-button mx-auto mt-2 w-6 h-6 rounded-md flex items-center justify-center", s.toggleBtn)}
          >
            <ChevronRight className={cn("w-3 h-3", s.toggleIcon)} />
          </button>
        )}
      </div>
    </aside>
  )
}
