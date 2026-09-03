"use client"

import { BlocksSidebar } from "@/components/editor/sidebar/BlocksSidebar"
import { LayersPanel } from "@/components/editor/sidebar/LayersPanel"
import { TemplatesPanel } from "@/components/editor/sidebar/TemplatesPanel"

import { StudioSidebarEmptyPanel } from "./StudioSidebarEmptyPanel"
import type { StudioSidebarTab } from "./types"

const PANEL_TITLES: Record<StudioSidebarTab, string> = {
  add: "Agregar contenido",
  layers: "Organizar página",
  templates: "Plantillas",
  assets: "Recursos",
  mentor: "Mentor",
  more: "Más opciones",
}

interface StudioSidebarPanelProps {
  activeTab: StudioSidebarTab
}

export function StudioSidebarPanel({
  activeTab,
}: StudioSidebarPanelProps) {
  return (
    <section className="flex h-full min-h-0 w-[292px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#091321] xl:w-[320px]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0b1728] px-4">
        <span className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-300">
          {PANEL_TITLES[activeTab]}
        </span>

        <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={activeTab === "add" ? "h-full" : "hidden"}>
          <BlocksSidebar />
        </div>

        <div className={activeTab === "layers" ? "h-full" : "hidden"}>
          <LayersPanel />
        </div>

        <div
          className={activeTab === "templates" ? "h-full" : "hidden"}
        >
          <TemplatesPanel />
        </div>

        {activeTab === "assets" && (
          <StudioSidebarEmptyPanel tab="assets" />
        )}

        {activeTab === "mentor" && (
          <StudioSidebarEmptyPanel tab="mentor" />
        )}

        {activeTab === "more" && (
          <StudioSidebarEmptyPanel tab="more" />
        )}
      </div>
    </section>
  )
}
