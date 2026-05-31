"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import type { AppConfig } from "@/app/webs/_shared/types/common"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

interface AppLayoutProps {
  config: AppConfig
  children: React.ReactNode
  /** Slot inside header left area (breadcrumb, page title, etc.) */
  headerTitle?: React.ReactNode
  /** Slot inside header right area (export button, date picker, etc.) */
  headerActions?: React.ReactNode
  searchPlaceholder?: string
  notificationCount?: number
  /** Optional slot rendered inside sidebar above nav (sprint card, store badge, etc.) */
  sidebarTopSlot?: React.ReactNode
  defaultCollapsed?: boolean
}

export function AppLayout({
  config,
  children,
  headerTitle,
  headerActions,
  searchPlaceholder,
  notificationCount,
  sidebarTopSlot,
  defaultCollapsed = false,
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const pathname = usePathname()

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)")
    const syncCollapsed = () => {
      if (mediaQuery.matches) setCollapsed(true)
    }

    syncCollapsed()
    mediaQuery.addEventListener("change", syncCollapsed)
    return () => mediaQuery.removeEventListener("change", syncCollapsed)
  }, [])

  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        lineHeight: 1.6,
      }}
    >
      <AppSidebar
        config={config}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        topSlot={sidebarTopSlot}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          config={config}
          titleSlot={headerTitle}
          actions={headerActions}
          searchPlaceholder={searchPlaceholder}
          notificationCount={notificationCount}
        />
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="page-transition min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
