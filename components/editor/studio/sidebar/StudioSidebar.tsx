"use client"

import { StudioSidebarPanel } from "./StudioSidebarPanel"
import { StudioSidebarRail } from "./StudioSidebarRail"
import type { StudioSidebarTab } from "./types"

interface StudioSidebarProps {
  activeTab: StudioSidebarTab
  onTabChange: (tab: StudioSidebarTab) => void
}

export function StudioSidebar({
  activeTab,
  onTabChange,
}: StudioSidebarProps) {
  return (
    <aside className="hidden min-h-0 shrink-0 lg:flex">
      <StudioSidebarRail
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <StudioSidebarPanel activeTab={activeTab} />
    </aside>
  )
}
