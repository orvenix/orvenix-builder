import { compileCommercialDesignV1 } from "@/lib/orvenix-ai/commercial-designs"
import type { EditorNode, EditorTree, NodeProps } from "@/types/editor"

/**
 * VE-1 human review: the approved Construction commercial demo
 * (construction@1 + fictional DemoFactsPack + already-sanitized demo
 * photos), compiled by the SAME deterministic pipeline customers use -- no
 * DB, no providers, no network. Gives the real customer editor a
 * representative multi-page commercial site (photo-led hero, services,
 * project evidence, progress band, footer) instead of a test page.
 */
export async function getVe1ReviewSitePages(): Promise<Array<{ slug: string; name: string; isHome: boolean; tree: EditorTree }>> {
  const compiled = await compileCommercialDesignV1({ mode: "demo", designId: "construction", version: 1 })
  return compiled.plan.pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.isHome, tree: page.tree }))
}

/**
 * VE-1: small deterministic EditorTree pinned by the focused unit tests.
 * Representative nesting (page > section > container > card > text) so
 * selection, breadcrumb, Escape-to-parent and section movement can be
 * reviewed. Fictional content; no assets, no network.
 */
export function createVe1ReviewTree(): EditorTree {
  const nodes: Record<string, EditorNode> = {}
  const add = (id: string, type: string, props: NodeProps, children: string[] = []) => {
    nodes[id] = { id, type, props, children, version: 1 }
    return id
  }
  const heading = (id: string, text: string, level = 2, extra: NodeProps = {}) => add(id, "heading", { text, level, size: level === 1 ? "5xl" : "3xl", weight: "extrabold", color: "#0f172a", ...extra })
  const text = (id: string, content: string, extra: NodeProps = {}) => add(id, "text", { content, color: "#475569", size: "md", ...extra })
  const wrapper = (id: string, className: string, children: string[]) => add(id, "genericWrapper", { tag: "div", className }, children)
  const section = (id: string, role: string, children: string[], background = "#ffffff") =>
    add(id, "section", { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background, compositionToken: `${role}|v1|standard` }, children)

  const nav = add("nav", "siteNav", { title: "Taller Ejemplo", subtitle: "Sitio de ejemplo", ctaLabel: "Contactar", ctaHref: "#contacto" })

  const hero = section("hero", "hero", [
    wrapper("hero-content", "mx-auto flex max-w-3xl flex-col items-center gap-5 text-center", [
      text("hero-eyebrow", "Sitio de ejemplo", { size: "sm", color: "#0e7490", align: "center" }),
      heading("hero-title", "Haz clic en este título para seleccionarlo", 1, { align: "center" }),
      text("hero-copy", "Pulsa Esc para subir al contenedor y otra vez para llegar a la sección. Usa ↑ y ↓ para recorrer elementos hermanos.", { size: "lg", align: "center" }),
      wrapper("hero-actions", "flex flex-col justify-center gap-3 sm:flex-row", [
        add("hero-cta", "ctaButton", { label: "Botón principal", href: "#contacto", variant: "primary", size: "lg" }),
        add("hero-secondary", "ctaButton", { label: "Botón secundario", href: "#servicios", variant: "secondary", size: "lg" }),
      ]),
    ]),
  ], "#f8fafc")

  const cards = ["Instalación", "Mantenimiento", "Reparación"].map((name, index) =>
    wrapper(`service-card-${index + 1}`, "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", [
      heading(`service-title-${index + 1}`, name, 3, { size: "xl" }),
      text(`service-copy-${index + 1}`, `Descripción de ejemplo del servicio ${index + 1}.`),
    ]),
  )
  const services = section("services", "services", [
    heading("services-title", "Servicios", 2, { align: "center" }),
    text("services-intro", "Una tarjeta dentro de una cuadrícula dentro de una sección: buen caso para la ruta de selección.", { align: "center" }),
    wrapper("services-grid", "mt-8 grid gap-5 md:grid-cols-3", cards),
  ])

  const process = section("process", "process", [
    heading("process-title", "Proceso", 2, { align: "center" }),
    wrapper("process-steps", "mt-8 grid gap-5 md:grid-cols-3", ["Cuéntanos", "Confirmamos", "Realizamos"].map((step, index) =>
      wrapper(`process-step-${index + 1}`, "rounded-2xl bg-slate-50 p-6", [heading(`process-step-title-${index + 1}`, `${index + 1}. ${step}`, 3, { size: "xl" })]),
    )),
  ], "#f8fafc")

  const cta = section("cta", "cta", [
    wrapper("cta-content", "mx-auto flex max-w-2xl flex-col items-center gap-4 text-center", [
      heading("cta-title", "Mueve esta sección con ↑ y ↓", 2, { align: "center", color: "#ffffff" }),
      text("cta-copy", "Las secciones se reordenan como bloques completos; nunca se cambian coordenadas.", { align: "center", color: "#e2e8f0" }),
      add("cta-button", "ctaButton", { label: "Llamado a la acción", href: "#contacto", variant: "primary", size: "lg" }),
    ]),
  ], "#0f172a")

  const footer = section("footer", "footer", [
    wrapper("footer-content", "mx-auto grid max-w-6xl gap-6 md:grid-cols-2", [
      heading("footer-brand", "Taller Ejemplo", 3, { size: "xl", color: "#ffffff" }),
      text("footer-contact", "Correo: contacto@example.com", { color: "#cbd5e1" }),
    ]),
  ], "#071826")

  add("root", "section", { maxWidth: "full", paddingY: "none", paddingX: "none" }, [nav, hero, services, process, cta, footer])
  return { rootId: "root", nodes }
}
