"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Building2,
  ChevronRight,
  Eye,
  FilePenLine,
  Globe2,
  History,
  MessageSquareText,
  Menu,
  MoreHorizontal,
  Palette,
  Rocket,
  Save,
  Search,
  Smartphone,
  Sparkles,
  Undo2,
  Redo2,
} from "lucide-react"

import { useEditorStore } from "@/store/useEditorStore"
import {
  closePendingPublishedSiteTab,
  navigatePublishedSiteTab,
  openPendingPublishedSiteTab,
} from "@/components/editor/client-shell/openPublishedSiteTab"
import { ClientBrandPanel } from "./ClientBrandPanel"
import { ClientContentPanel } from "./ClientContentPanel"

type ClientPanel = "brand" | "menu" | "content" | "actions" | "pages" | "design" | "advanced"

export function ClientWorkspaceSidebar() {
  const builderTier = useEditorStore((state) => state.builderTier)
  const isPro = builderTier === "pro"
  const [activePanel, setActivePanel] = useState<ClientPanel>("brand")
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    function handlePanelRequest(event: Event) {
      const panel = (event as CustomEvent<{ panel?: ClientPanel }>).detail?.panel
      if (panel !== "content" && panel !== "menu") return

      setShowMore(false)
      setActivePanel(panel)
    }

    window.addEventListener("orvenix:client-panel-request", handlePanelRequest)
    return () => window.removeEventListener("orvenix:client-panel-request", handlePanelRequest)
  }, [])

  const primaryTabs = useMemo(
    () => [
      { id: "brand" as const, label: "Marca", icon: Building2 },
      { id: "menu" as const, label: "Menú", icon: Menu },
      { id: "content" as const, label: "Contenido", icon: FilePenLine },
      { id: "actions" as const, label: "Acciones", icon: Rocket },
      ...(isPro
        ? [
            { id: "pages" as const, label: "Páginas", icon: Globe2 },
            { id: "design" as const, label: "Diseño", icon: Palette },
          ]
        : []),
    ],
    [isPro],
  )

  return (
    <aside className="flex h-full w-[376px] shrink-0 overflow-hidden border-r border-white/[0.07] bg-[#08111f] shadow-2xl shadow-black/25">
      <nav className="flex w-[78px] shrink-0 flex-col border-r border-white/[0.07] bg-[#060d18] px-2 py-3">
        <div className="mb-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.045] px-2 py-2 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300">
            {isPro ? "Pro" : "Básico"}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {primaryTabs.map((tab) => (
            <ClientNavButton
              key={tab.id}
              label={tab.label}
              active={activePanel === tab.id}
              onClick={() => {
                setActivePanel(tab.id)
                setShowMore(false)
              }}
            >
              <tab.icon className="h-5 w-5" aria-hidden="true" />
            </ClientNavButton>
          ))}
        </div>

        {isPro && (
          <ClientNavButton
            label="Más"
            active={activePanel === "advanced" || showMore}
            onClick={() => {
              setShowMore((value) => !value)
              setActivePanel("advanced")
            }}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </ClientNavButton>
        )}
      </nav>

      <div className="min-w-0 flex-1 overflow-hidden">
        {activePanel === "brand" && <ClientBrandPanel embedded mode={isPro ? "pro" : "basic"} />}
        {activePanel === "menu" && <ClientMenuPanel isPro={isPro} />}
        {activePanel === "content" && <ClientContentPanel />}
        {activePanel === "actions" && <ClientActionsPanel isPro={isPro} />}
        {activePanel === "pages" && isPro && <ClientPagesPanel />}
        {activePanel === "design" && isPro && <ClientDesignPanel />}
        {activePanel === "advanced" && isPro && <ClientAdvancedPanel />}
      </div>
    </aside>
  )
}

function ClientMenuPanel({ isPro }: { isPro: boolean }) {
  const tree = useEditorStore((state) => state.tree)
  const availablePages = useEditorStore((state) => state.availablePages)
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps)
  const select = useEditorStore((state) => state.select)

  const navEntry = useMemo(
    () => Object.entries(tree.nodes).find(([, node]) => node.type === "siteNav") ?? null,
    [tree.nodes],
  )
  const navId = navEntry?.[0] ?? null
  const navProps = navEntry?.[1].props ?? {}
  const labels = useMemo(
    () => parseMenuLabels(String(navProps.labelOverrides ?? "")),
    [navProps.labelOverrides],
  )

  function updateNav(patch: Record<string, unknown>) {
    if (!navId) return
    updateNodeProps(navId, patch)
  }

  function updateLabel(slug: string, value: string) {
    const next = new Map(labels)
    const originalName = availablePages.find((page) => page.slug === slug)?.name ?? ""
    if (!value.trim() || value.trim() === originalName) next.delete(slug)
    else next.set(slug, value.trim())
    updateNav({ labelOverrides: serializeMenuLabels(next) })
  }

  if (!navId) {
    return (
      <PanelShell eyebrow="Menú" title="Menú del sitio" description="Este sitio todavía no tiene un bloque de navegación editable.">
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] p-3 text-xs leading-5 text-amber-100">
          Agrega una navegación al sitio para poder editar el menú desde aquí.
        </div>
      </PanelShell>
    )
  }

  return (
    <PanelShell eyebrow="Menú" title="Navegación del sitio" description="Edita lo que el cliente ve en el menú sin tocar configuraciones técnicas.">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => select(navId)}
          className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.075] px-3 py-3 text-left text-cyan-100 transition hover:bg-cyan-300/[0.11]"
        >
          <span>
            <span className="block text-xs font-black">Seleccionar menú en lienzo</span>
            <span className="mt-0.5 block text-[10px] text-cyan-100/60">Resalta el bloque para moverlo o revisar su marco.</span>
          </span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <SidebarField label="Nombre visible">
          <input
            type="text"
            value={String(navProps.title ?? "")}
            placeholder="Nombre del negocio"
            onChange={(event) => updateNav({ title: event.target.value })}
            className={SIDEBAR_INPUT_CLASS}
          />
        </SidebarField>

        <SidebarField label="Subtítulo">
          <input
            type="text"
            value={String(navProps.subtitle ?? "")}
            placeholder="Sitio profesional"
            onChange={(event) => updateNav({ subtitle: event.target.value })}
            className={SIDEBAR_INPUT_CLASS}
          />
        </SidebarField>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-300">Enlaces visibles</p>
          <div className="mt-3 space-y-3">
            {availablePages.map((page) => (
              <SidebarField key={page.slug} label={`/${page.slug === "home" ? "" : page.slug}`}>
                <input
                  type="text"
                  value={labels.get(page.slug) ?? page.name}
                  onChange={(event) => updateLabel(page.slug, event.target.value)}
                  className={SIDEBAR_INPUT_CLASS}
                />
              </SidebarField>
            ))}
          </div>
        </div>

        <SidebarField label="Ocultar páginas">
          <input
            type="text"
            value={String(navProps.hiddenSlugs ?? "")}
            placeholder="blog, contacto-interno"
            onChange={(event) => updateNav({ hiddenSlugs: event.target.value })}
            className={SIDEBAR_INPUT_CLASS}
          />
        </SidebarField>

        <label className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-3 text-xs font-bold text-slate-200">
          Mostrar botón
          <input
            type="checkbox"
            checked={navProps.showCta !== false}
            onChange={(event) => updateNav({ showCta: event.target.checked })}
            className="h-4 w-4 accent-cyan-300"
          />
        </label>

        <SidebarField label="Texto del botón">
          <input
            type="text"
            value={String(navProps.ctaLabel ?? "Contactar")}
            placeholder="Contactar"
            onChange={(event) => updateNav({ ctaLabel: event.target.value })}
            className={SIDEBAR_INPUT_CLASS}
          />
        </SidebarField>

        {isPro && (
          <SidebarField label="Enlace del botón">
            <input
              type="text"
              value={String(navProps.ctaHref ?? "#contacto")}
              placeholder="#contacto"
              onChange={(event) => updateNav({ ctaHref: event.target.value })}
              className={SIDEBAR_INPUT_CLASS}
            />
          </SidebarField>
        )}
      </div>
    </PanelShell>
  )
}

function ClientActionsPanel({ isPro }: { isPro: boolean }) {
  const websiteId = useEditorStore((state) => state.websiteId)
  const saveStatus = useEditorStore((state) => state.saveStatus)
  const publishStatus = useEditorStore((state) => state.publishStatus)
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode)
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode)
  const saveToLocalStorage = useEditorStore((state) => state.saveToLocalStorage)
  const saveToServer = useEditorStore((state) => state.saveToServer)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.undoStack.length > 0)
  const canRedo = useEditorStore((state) => state.redoStack.length > 0)
  const publishWebsite = useEditorStore((state) => state.publishWebsite)
  const isDraft = !websiteId || websiteId.startsWith("draft:")

  async function handleSave() {
    saveToLocalStorage()
    if (!isDraft) await saveToServer()
  }

  async function handlePublishAction() {
    if (isDraft) {
      saveToLocalStorage()
      setPreviewMode(true)
      return
    }

    const publishedTab = openPendingPublishedSiteTab()
    const publishedUrl = await publishWebsite()
    if (publishedUrl) {
      navigatePublishedSiteTab(publishedTab, publishedUrl)
    } else {
      closePendingPublishedSiteTab(publishedTab)
    }
  }

  return (
    <PanelShell
      eyebrow="Acciones"
      title="Controles esenciales"
      description={isPro ? "Acciones rápidas para revisar, guardar y preparar la publicación." : "Lo básico para trabajar sin perderte: guardar, revisar y volver atrás."}
    >
      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={Save} label="Guardar" detail={saveLabel(saveStatus)} onClick={handleSave} />
        <ActionButton icon={Eye} label={isPreviewMode ? "Editar" : "Vista previa"} detail="Ver sin controles" onClick={() => setPreviewMode(!isPreviewMode)} />
        <ActionButton icon={Undo2} label="Deshacer" detail="Último cambio" onClick={undo} disabled={!canUndo} />
        <ActionButton icon={Redo2} label="Rehacer" detail="Recuperar cambio" onClick={redo} disabled={!canRedo} />
      </div>

      <button
        type="button"
        onClick={handlePublishAction}
        className="mt-3 flex w-full items-center justify-between rounded-2xl bg-cyan-400 px-4 py-3 text-left text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.99]"
      >
        <span>
          <span className="block text-sm font-black">{isDraft ? "Activar para publicar" : "Publicar sitio"}</span>
          <span className="mt-0.5 block text-[11px] font-bold text-slate-800/70">{publishStatus === "published" ? "Publicado" : isDraft ? "Comprar o rentar antes de publicar" : "Guardar y publicar"}</span>
        </span>
        <Rocket className="h-5 w-5" aria-hidden="true" />
      </button>

      {!isPro && (
        <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] p-3">
          <p className="text-xs font-bold text-amber-100">Modo básico</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">Tienes las herramientas esenciales. Pro agrega páginas, SEO, responsive y herramientas avanzadas.</p>
        </div>
      )}
    </PanelShell>
  )
}

function ClientPagesPanel() {
  const availablePages = useEditorStore((state) => state.availablePages)
  const activePageSlug = useEditorStore((state) => state.activePageSlug)
  const setActivePageContext = useEditorStore((state) => state.setActivePageContext)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(page: { slug: string; name: string }) {
    const params = new URLSearchParams(searchParams?.toString() ?? "")
    if (page.slug === "home") params.delete("page")
    else params.set("page", page.slug)

    setActivePageContext({
      activePageSlug: page.slug,
      activePageName: page.name,
      availablePages,
    })

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  return (
    <PanelShell eyebrow="Pro" title="Páginas del sitio" description="Cambia de página sin salir del editor. El menú del sitio queda conectado.">
      <div className="space-y-2">
        {availablePages.map((page) => {
          const active = page.slug === activePageSlug
          return (
            <button
              key={page.slug}
              type="button"
              onClick={() => navigate(page)}
              className={["flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", active ? "border-cyan-300/35 bg-cyan-300/[0.09] text-white" : "border-white/[0.07] bg-white/[0.035] text-slate-300 hover:border-white/[0.14] hover:bg-white/[0.055]"].join(" ")}
            >
              <Globe2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-black">{page.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-500">/{page.slug === "home" ? "" : page.slug}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </PanelShell>
  )
}

function ClientDesignPanel() {
  return <ClientBrandPanel embedded mode="pro" focus="design" />
}

function ClientAdvancedPanel() {
  const seoOpen = useEditorStore((state) => state.seoOpen)
  const setSeoOpen = useEditorStore((state) => state.setSeoOpen)
  const isCommentMode = useEditorStore((state) => state.isCommentMode)
  const setCommentMode = useEditorStore((state) => state.setCommentMode)
  const isResponsivePreviewMode = useEditorStore((state) => state.isResponsivePreviewMode)
  const setResponsivePreviewMode = useEditorStore((state) => state.setResponsivePreviewMode)
  const currentDevice = useEditorStore((state) => state.currentDevice)
  const setDevice = useEditorStore((state) => state.setDevice)
  const setCanvasZoom = useEditorStore((state) => state.setCanvasZoom)
  const canvasZoom = useEditorStore((state) => state.canvasZoom)

  return (
    <PanelShell eyebrow="Pro" title="Más opciones" description="Herramientas avanzadas agrupadas para no saturar el modo básico.">
      <div className="space-y-2">
        <ActionRow icon={Search} label="SEO" detail={seoOpen ? "Panel activo" : "Títulos y metadatos"} onClick={() => setSeoOpen(!seoOpen)} active={seoOpen} />
        <ActionRow icon={MessageSquareText} label="Comentarios" detail="Revisiones sobre el sitio" onClick={() => setCommentMode(!isCommentMode)} active={isCommentMode} />
        <ActionRow icon={Smartphone} label="Responsive" detail="Revisar por dispositivo" onClick={() => setResponsivePreviewMode(!isResponsivePreviewMode)} active={isResponsivePreviewMode} />
        <ActionRow icon={Sparkles} label="Ajustar zoom" detail={`${canvasZoom}%`} onClick={() => setCanvasZoom(canvasZoom >= 100 ? 75 : canvasZoom + 25)} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["desktop", "tablet", "mobile"] as const).map((device) => (
          <button
            key={device}
            type="button"
            onClick={() => setDevice(device)}
            className={["rounded-xl border px-2 py-2 text-[10px] font-black capitalize transition", currentDevice === device ? "border-cyan-300/35 bg-cyan-300/[0.1] text-cyan-100" : "border-white/[0.07] bg-white/[0.035] text-slate-500 hover:text-slate-200"].join(" ")}
          >
            {device === "desktop" ? "PC" : device === "tablet" ? "Tablet" : "Móvil"}
          </button>
        ))}
      </div>
    </PanelShell>
  )
}

function ClientNavButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={["flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-[9px] font-black transition active:scale-95", active ? "bg-cyan-400/[0.12] text-cyan-200 ring-1 ring-cyan-300/20 shadow-lg shadow-cyan-950/15" : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-300"].join(" ")}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function PanelShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-[#091321] text-slate-200">
      <header className="shrink-0 border-b border-white/[0.07] bg-[#0b1728] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">{eyebrow}</p>
        <h2 className="mt-1 text-sm font-black text-white">{title}</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </section>
  )
}

function ActionButton({ icon: Icon, label, detail, onClick, disabled }: { icon: typeof Save; label: string; detail: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4 text-cyan-300" aria-hidden="true" />
      <span className="mt-2 block text-xs font-black text-white">{label}</span>
      <span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span>
    </button>
  )
}

function ActionRow({ icon: Icon, label, detail, onClick, active }: { icon: typeof History; label: string; detail: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", active ? "border-cyan-300/35 bg-cyan-300/[0.1]" : "border-white/[0.07] bg-white/[0.035] hover:border-white/[0.14] hover:bg-white/[0.055]"].join(" ")}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.055] text-cyan-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-white">{label}</span>
        <span className="mt-0.5 block text-[10px] text-slate-500">{detail}</span>
      </span>
    </button>
  )
}

function saveLabel(status: string) {
  if (status === "saving") return "Guardando..."
  if (status === "saved") return "Guardado"
  if (status === "dirty") return "Pendiente"
  if (status === "error") return "Revisar"
  return "Local y nube"
}

const SIDEBAR_INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/35 focus:bg-white/[0.05]"

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function parseMenuLabels(value: string) {
  return new Map(
    String(value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [slug, ...labelParts] = line.includes("=") ? line.split("=") : line.split(":")
        return [slug.trim(), labelParts.join("=").trim()] as const
      })
      .filter(([slug, label]) => slug && label),
  )
}

function serializeMenuLabels(labels: Map<string, string>) {
  return Array.from(labels.entries())
    .map(([slug, label]) => `${slug}=${label}`)
    .join("\n")
}
