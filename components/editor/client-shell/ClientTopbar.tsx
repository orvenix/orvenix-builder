"use client"

import Image from "next/image"
import Link from "next/link"

import {
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  Repeat,
  Rocket,
  Save,
} from "lucide-react"

import { useEditorStore } from "@/store/useEditorStore"
import { useCheckoutRegistrationFlow } from "@/hooks/useCheckoutRegistrationFlow"
import { useState } from "react"
import {
  closePendingPublishedSiteTab,
  navigatePublishedSiteTab,
  openPendingPublishedSiteTab,
} from "./openPublishedSiteTab"

export function ClientTopbar() {
  const websiteId = useEditorStore((state) => state.websiteId)
  const saveStatus = useEditorStore((state) => state.saveStatus)
  const publishStatus = useEditorStore((state) => state.publishStatus)
  const isPreviewMode = useEditorStore(
    (state) => state.isPreviewMode,
  )
  const setPreviewMode = useEditorStore(
    (state) => state.setPreviewMode,
  )
  const saveToLocalStorage = useEditorStore((state) => state.saveToLocalStorage)
  const publishWebsite = useEditorStore((state) => state.publishWebsite)
  const { startCheckout, isCheckingSession } = useCheckoutRegistrationFlow()
  const [showDraftPublishOptions, setShowDraftPublishOptions] = useState(false)
  const [draftPublishAction, setDraftPublishAction] = useState<"buy" | "rent" | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const status = getSaveStatus(saveStatus)
  const isDraft = !websiteId || websiteId.startsWith("draft:")

  async function handlePublishAction() {
    if (isDraft) {
      saveToLocalStorage()
      setShowDraftPublishOptions((value) => !value)
      return
    }

    const publishedTab = openPendingPublishedSiteTab()

    setIsPublishing(true)
    try {
      const publishedUrl = await publishWebsite()
      if (publishedUrl) {
        navigatePublishedSiteTab(publishedTab, publishedUrl)
      } else {
        closePendingPublishedSiteTab(publishedTab)
      }
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDraftPublish(action: "buy" | "rent") {
    if (draftPublishAction || isCheckingSession) return

    saveToLocalStorage()
    setDraftPublishAction(action)
    try {
      await startCheckout({ action })
    } finally {
      setDraftPublishAction(null)
    }
  }

  return (
    <header className="ov-topbar editor-orvenix-topbar relative flex h-16 shrink-0 items-center justify-between gap-4 px-3 text-slate-100 shadow-sm md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Volver al panel"
          title="Volver al panel"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>

        <div className="h-6 w-px shrink-0 bg-white/[0.08]" />

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

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-black text-white">
            Mi página
          </p>

          <p className="truncate text-[10px] font-semibold text-slate-500">
            {websiteId ?? "Orvenix"}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 sm:flex">
        {status.icon}

        <span className="text-[11px] font-bold text-slate-300">
          {status.label}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setPreviewMode(!isPreviewMode)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-white/[0.07] hover:text-white"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />

          <span className="hidden sm:inline">
            {isPreviewMode ? "Volver a editar" : "Vista previa"}
          </span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handlePublishAction}
            disabled={isPublishing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Rocket className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{isDraft ? "Publicar" : publishStatus === "published" ? "Publicado" : "Publicar"}</span>
          </button>

          {isDraft && showDraftPublishOptions && (
            <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/[0.10] bg-slate-950 p-2 shadow-2xl shadow-black/45">
              <p className="px-3 py-2 text-[11px] font-semibold leading-5 text-slate-400">
                Para publicar este constructor primero activa el sitio.
              </p>
              <button
                type="button"
                disabled={isCheckingSession || draftPublishAction !== null}
                onClick={() => void handleDraftPublish("rent")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.10] disabled:opacity-60"
              >
                {draftPublishAction === "rent" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
                Rentar y publicar
              </button>
              <button
                type="button"
                disabled={isCheckingSession || draftPublishAction !== null}
                onClick={() => void handleDraftPublish("buy")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/[0.10] disabled:opacity-60"
              >
                {draftPublishAction === "buy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Comprar y publicar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function getSaveStatus(status: string) {
  if (status === "saving") {
    return {
      label: "Guardando...",
      icon: (
        <Save
          className="h-3.5 w-3.5 animate-pulse text-cyan-300"
          aria-hidden="true"
        />
      ),
    }
  }

  if (status === "saved") {
    return {
      label: "Todos los cambios guardados",
      icon: (
        <CheckCircle2
          className="h-3.5 w-3.5 text-emerald-300"
          aria-hidden="true"
        />
      ),
    }
  }

  if (status === "dirty") {
    return {
      label: "Cambios pendientes",
      icon: (
        <Save
          className="h-3.5 w-3.5 text-amber-300"
          aria-hidden="true"
        />
      ),
    }
  }

  return {
    label: "Página lista",
    icon: (
      <CheckCircle2
        className="h-3.5 w-3.5 text-slate-500"
        aria-hidden="true"
      />
    ),
  }
}
