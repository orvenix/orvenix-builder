"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  Settings,
  Sparkles,
} from "lucide-react"
import { useEditorExperience } from "@/components/editor/experience"
import { useEditorStore } from "@/store/useEditorStore"
import { DeviceToggle } from "@/components/editor/toolbar/DeviceToggle"
import { HistoryControls } from "@/components/editor/toolbar/HistoryControls"
import { PreviewModeButton } from "@/components/editor/toolbar/PreviewModeButton"
import { PublishButton } from "@/components/editor/toolbar/PublishButton"
import { SaveStatus } from "@/components/editor/toolbar/SaveStatus"
import { ExperienceModeToggle } from "@/components/editor/experience"

function getProjectName(websiteId: string | null) {
  if (!websiteId) return "Proyecto nuevo"

  if (websiteId.startsWith("draft:")) {
    return "Sitio sin publicar"
  }

  return `Sitio ${websiteId.slice(0, 8)}`
}

export function StudioTopBar() {
  const { isStudio } = useEditorExperience()
  const websiteId = useEditorStore((state) => state.websiteId)
  const isPreviewMode = useEditorStore(
    (state) => state.isPreviewMode,
  )

  const projectName = getProjectName(websiteId)

  return (
    <header className="ov-topbar editor-orvenix-topbar relative z-[110] flex h-[68px] shrink-0 items-center px-3 shadow-sm sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Volver al panel"
          title="Volver al panel"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>

        <div className="h-6 w-px shrink-0 bg-white/[0.07]" />

        <Link
          href="/"
          aria-label="Orvenix — inicio"
          title="Orvenix"
          className="logo logo-enhanced editor-studio-logo shrink-0"
        >
          <span className="logo-glow-ring" aria-hidden="true" />
          <Image
            src="/img/logo-main.png"
            alt="Orvenix"
            width={196}
            height={66}
            className="logo-image"
            priority
          />
        </Link>

        <ExperienceModeToggle />
        
        <div className="flex items-center gap-2">
  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
    Orvenix
  </p>

  <span
    className={[
      "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]",
      isStudio
        ? "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300"
        : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
    ].join(" ")}
  >
    {isStudio ? "Studio" : "Edición sencilla"}
  </span>
</div>

          <button
            type="button"
            title="Opciones del proyecto"
            className="mt-0.5 flex max-w-52 items-center gap-1.5 text-left text-sm font-bold text-slate-100 transition hover:text-white"
          >
            <span className="truncate">{projectName}</span>

            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 text-slate-600"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="hidden xl:block">
          <SaveStatus />
        </div>

      {!isPreviewMode && (
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 lg:flex">
          <HistoryControls />

          <div className="h-6 w-px bg-white/[0.07]" />

          <DeviceToggle />
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {!isPreviewMode && (
          <button
            type="button"
            title="Abrir Mentor"
            className="hidden h-9 items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] px-3 text-xs font-bold text-cyan-300 transition hover:border-cyan-300/25 hover:bg-cyan-400/[0.12] md:flex"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Mentor
          </button>
        )}

        <PreviewModeButton />

        <PublishButton />

        <details className="relative">
          <summary
            aria-label="Más acciones"
            title="Más acciones"
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white [&::-webkit-details-marker]:hidden"
          >
            <MoreHorizontal className="h-4 w-4" />
          </summary>

          <div className="absolute right-0 top-11 w-52 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1729] p-1.5 shadow-2xl">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Configuración del sitio
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}
