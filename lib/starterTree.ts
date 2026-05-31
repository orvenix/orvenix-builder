import type { EditorTree } from "@/types/editor"

/**
 * Sitio inicial 100% editable inline.
 * Todos los bloques son PRIMITIVOS: section, heading, text, ctaButton.
 * El cliente hace doble clic en CUALQUIER texto para editarlo directamente.
 */
export function buildRichStarterTree(): EditorTree {
  return {
    version: 1,
    rootId: "root",
    theme: {
      colors: { primary: "#6366f1", secondary: "#0f172a", background: "#0f172a", text: "#ffffff", accent: "#6366f1" },
      fontHeading: "Inter",
      fontBody: "Inter",
      spacing: { sectionX: "1.5rem", sectionY: "3rem", stack: "1.5rem" },
      radius: { card: "1rem", button: "999px" },
      shadow: {
        soft: "0 12px 32px rgba(15,23,42,0.08)",
        strong: "0 24px 60px rgba(15,23,42,0.18)",
      },
      motion: {
        duration: "240ms",
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
    seo: {
      title: "Mi Negocio — Sitio profesional",
      description: "Descripción de mi negocio y los servicios que ofrezco.",
      keywords: "",
      ogImage: "",
    },
    nodes: {
      root: {
        id: "root",
        type: "section",
        displayName: "Sitio completo",
        props: { maxWidth: "full", paddingY: "none", paddingX: "none", background: "#0f172a" },
        children: ["hero-section", "servicios-section", "nosotros-section", "testimonios-section", "contacto-section"],
        version: 1,
      },

      // ── HERO ──────────────────────────────────────────────────────────────
      "hero-section": {
        id: "hero-section", type: "section", displayName: "Hero",
        props: { maxWidth: "lg", paddingY: "xl", paddingX: "md", align: "center", background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)" },
        children: ["hero-eyebrow", "hero-title", "hero-subtitle", "hero-cta"], version: 1,
      },
      "hero-eyebrow": {
        id: "hero-eyebrow", type: "text", displayName: "Etiqueta hero",
        props: { content: "✦ Tu negocio en línea · Profesional · Editable", size: "sm", color: "#818cf8", align: "center" },
        children: [], version: 1,
      },
      "hero-title": {
        id: "hero-title", type: "heading", displayName: "Título principal",
        props: { text: "Tu negocio, al siguiente nivel", level: 1, size: "5xl", weight: "extrabold", color: "#ffffff", align: "center", marginBottom: "md" },
        children: [], version: 1,
      },
      "hero-subtitle": {
        id: "hero-subtitle", type: "text", displayName: "Descripción hero",
        props: { content: "Somos expertos en nuestra especialidad. Ayudamos a nuestros clientes a crecer con resultados reales y un servicio de primera calidad.", size: "lg", color: "#94a3b8", align: "center", maxWidth: "md" },
        children: [], version: 1,
      },
      "hero-cta": {
        id: "hero-cta", type: "ctaButton", displayName: "Botón principal",
        props: { label: "Contáctanos ahora", href: "#contacto", variant: "primary", size: "lg" },
        children: [], version: 1,
      },

      // ── SERVICIOS ─────────────────────────────────────────────────────────
      "servicios-section": {
        id: "servicios-section", type: "section", displayName: "Servicios",
        props: { maxWidth: "lg", paddingY: "xl", paddingX: "md", align: "center", background: "#1e293b" },
        children: ["srv-tag", "srv-title", "srv-sub", "srv-grid"], version: 1,
      },
      "srv-tag": {
        id: "srv-tag", type: "text",
        props: { content: "NUESTROS SERVICIOS", size: "sm", color: "#6366f1", align: "center" },
        children: [], version: 1,
      },
      "srv-title": {
        id: "srv-title", type: "heading", displayName: "Título servicios",
        props: { text: "Todo lo que necesitas", level: 2, size: "4xl", weight: "extrabold", color: "#ffffff", align: "center", marginBottom: "sm" },
        children: [], version: 1,
      },
      "srv-sub": {
        id: "srv-sub", type: "text",
        props: { content: "Servicios diseñados para hacer crecer tu negocio desde el primer día.", size: "md", color: "#94a3b8", align: "center", maxWidth: "md" },
        children: [], version: 1,
      },
      "srv-grid": {
        id: "srv-grid", type: "section",
        props: { maxWidth: "full", paddingY: "md", paddingX: "none" },
        children: ["srv-1", "srv-2", "srv-3"], version: 1,
      },
      "srv-1": {
        id: "srv-1", type: "section", displayName: "Servicio 1",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a", align: "center" },
        children: ["srv-1-icon", "srv-1-title", "srv-1-desc"], version: 1,
      },
      "srv-1-icon": { id: "srv-1-icon", type: "text", props: { content: "🚀", size: "lg", align: "center" }, children: [], version: 1 },
      "srv-1-title": {
        id: "srv-1-title", type: "heading", displayName: "Nombre servicio 1",
        props: { text: "Servicio 1", level: 3, size: "xl", weight: "bold", color: "#ffffff", align: "center", marginBottom: "sm" },
        children: [], version: 1,
      },
      "srv-1-desc": {
        id: "srv-1-desc", type: "text",
        props: { content: "Describe aquí el primer servicio. Qué incluye y qué beneficio le da al cliente.", size: "sm", color: "#94a3b8", align: "center" },
        children: [], version: 1,
      },
      "srv-2": {
        id: "srv-2", type: "section", displayName: "Servicio 2",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a", align: "center" },
        children: ["srv-2-icon", "srv-2-title", "srv-2-desc"], version: 1,
      },
      "srv-2-icon": { id: "srv-2-icon", type: "text", props: { content: "⚡", size: "lg", align: "center" }, children: [], version: 1 },
      "srv-2-title": {
        id: "srv-2-title", type: "heading", displayName: "Nombre servicio 2",
        props: { text: "Servicio 2", level: 3, size: "xl", weight: "bold", color: "#ffffff", align: "center", marginBottom: "sm" },
        children: [], version: 1,
      },
      "srv-2-desc": {
        id: "srv-2-desc", type: "text",
        props: { content: "Describe el segundo servicio. Resalta el resultado concreto que el cliente puede esperar.", size: "sm", color: "#94a3b8", align: "center" },
        children: [], version: 1,
      },
      "srv-3": {
        id: "srv-3", type: "section", displayName: "Servicio 3",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a", align: "center" },
        children: ["srv-3-icon", "srv-3-title", "srv-3-desc"], version: 1,
      },
      "srv-3-icon": { id: "srv-3-icon", type: "text", props: { content: "🎯", size: "lg", align: "center" }, children: [], version: 1 },
      "srv-3-title": {
        id: "srv-3-title", type: "heading", displayName: "Nombre servicio 3",
        props: { text: "Servicio 3", level: 3, size: "xl", weight: "bold", color: "#ffffff", align: "center", marginBottom: "sm" },
        children: [], version: 1,
      },
      "srv-3-desc": {
        id: "srv-3-desc", type: "text",
        props: { content: "Describe el tercer servicio. Enfócate en el valor para el cliente.", size: "sm", color: "#94a3b8", align: "center" },
        children: [], version: 1,
      },

      // ── NOSOTROS / POR QUÉ ELEGIRNOS ─────────────────────────────────────
      "nosotros-section": {
        id: "nosotros-section", type: "section", displayName: "Por qué elegirnos",
        props: { maxWidth: "lg", paddingY: "xl", paddingX: "md", background: "#0f172a" },
        children: ["nos-tag", "nos-title", "nos-sub", "nos-f1", "nos-f2", "nos-f3", "nos-f4"], version: 1,
      },
      "nos-tag": {
        id: "nos-tag", type: "text",
        props: { content: "¿POR QUÉ ELEGIRNOS?", size: "sm", color: "#6366f1", align: "left" },
        children: [], version: 1,
      },
      "nos-title": {
        id: "nos-title", type: "heading", displayName: "Título nosotros",
        props: { text: "Resultados reales desde el primer día", level: 2, size: "4xl", weight: "extrabold", color: "#ffffff", align: "left", marginBottom: "sm" },
        children: [], version: 1,
      },
      "nos-sub": {
        id: "nos-sub", type: "text",
        props: { content: "Llevamos anos ayudando a negocios a crecer con estrategias probadas y resultados medibles.", size: "md", color: "#94a3b8", align: "left", maxWidth: "md" },
        children: [], version: 1,
      },
      "nos-f1": {
        id: "nos-f1", type: "section", displayName: "Punto 1",
        props: { maxWidth: "sm", paddingY: "sm", paddingX: "none" },
        children: ["nos-f1-title", "nos-f1-desc"], version: 1,
      },
      "nos-f1-title": {
        id: "nos-f1-title", type: "heading",
        props: { text: "✓ Experiencia comprobada", level: 3, size: "xl", weight: "bold", color: "#a5b4fc", align: "left", marginBottom: "sm" },
        children: [], version: 1,
      },
      "nos-f1-desc": {
        id: "nos-f1-desc", type: "text",
        props: { content: "Cientos de clientes satisfechos respaldan nuestro trabajo. La experiencia habla por si sola.", size: "sm", color: "#94a3b8", align: "left" },
        children: [], version: 1,
      },
      "nos-f2": {
        id: "nos-f2", type: "section", displayName: "Punto 2",
        props: { maxWidth: "sm", paddingY: "sm", paddingX: "none" },
        children: ["nos-f2-title", "nos-f2-desc"], version: 1,
      },
      "nos-f2-title": {
        id: "nos-f2-title", type: "heading",
        props: { text: "✓ Resultados medibles", level: 3, size: "xl", weight: "bold", color: "#a5b4fc", align: "left", marginBottom: "sm" },
        children: [], version: 1,
      },
      "nos-f2-desc": {
        id: "nos-f2-desc", type: "text",
        props: { content: "Cada proyecto tiene metas claras y métricas de seguimiento para que veas el avance.", size: "sm", color: "#94a3b8", align: "left" },
        children: [], version: 1,
      },
      "nos-f3": {
        id: "nos-f3", type: "section", displayName: "Punto 3",
        props: { maxWidth: "sm", paddingY: "sm", paddingX: "none" },
        children: ["nos-f3-title", "nos-f3-desc"], version: 1,
      },
      "nos-f3-title": {
        id: "nos-f3-title", type: "heading",
        props: { text: "✓ Equipo profesional", level: 3, size: "xl", weight: "bold", color: "#a5b4fc", align: "left", marginBottom: "sm" },
        children: [], version: 1,
      },
      "nos-f3-desc": {
        id: "nos-f3-desc", type: "text",
        props: { content: "Especialistas certificados con experiencia real en tu industria.", size: "sm", color: "#94a3b8", align: "left" },
        children: [], version: 1,
      },
      "nos-f4": {
        id: "nos-f4", type: "section", displayName: "Punto 4",
        props: { maxWidth: "sm", paddingY: "sm", paddingX: "none" },
        children: ["nos-f4-title", "nos-f4-desc"], version: 1,
      },
      "nos-f4-title": {
        id: "nos-f4-title", type: "heading",
        props: { text: "✓ Soporte continuo", level: 3, size: "xl", weight: "bold", color: "#a5b4fc", align: "left", marginBottom: "sm" },
        children: [], version: 1,
      },
      "nos-f4-desc": {
        id: "nos-f4-desc", type: "text",
        props: { content: "Te acompañamos antes, durante y después de cada proyecto. Siempre disponibles.", size: "sm", color: "#94a3b8", align: "left" },
        children: [], version: 1,
      },

      // ── TESTIMONIOS ───────────────────────────────────────────────────────
      "testimonios-section": {
        id: "testimonios-section", type: "section", displayName: "Testimonios",
        props: { maxWidth: "lg", paddingY: "xl", paddingX: "md", align: "center", background: "#1e293b" },
        children: ["tst-tag", "tst-title", "tst-1", "tst-2", "tst-3"], version: 1,
      },
      "tst-tag": {
        id: "tst-tag", type: "text",
        props: { content: "CLIENTES SATISFECHOS", size: "sm", color: "#6366f1", align: "center" },
        children: [], version: 1,
      },
      "tst-title": {
        id: "tst-title", type: "heading", displayName: "Título testimonios",
        props: { text: "Lo que dicen nuestros clientes", level: 2, size: "4xl", weight: "extrabold", color: "#ffffff", align: "center", marginBottom: "md" },
        children: [], version: 1,
      },
      "tst-1": {
        id: "tst-1", type: "section", displayName: "Testimonio 1",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a" },
        children: ["tst-1-stars", "tst-1-quote", "tst-1-author"], version: 1,
      },
      "tst-1-stars": { id: "tst-1-stars", type: "text", props: { content: "★★★★★", size: "md", color: "#fbbf24", align: "left" }, children: [], version: 1 },
      "tst-1-quote": {
        id: "tst-1-quote", type: "text", displayName: "Cita 1",
        props: { content: '"Excelente servicio. Superaron todas nuestras expectativas y los resultados fueron inmediatos."', size: "md", color: "#e2e8f0", align: "left" },
        children: [], version: 1,
      },
      "tst-1-author": { id: "tst-1-author", type: "text", props: { content: "— María G., Directora", size: "sm", color: "#818cf8", align: "left" }, children: [], version: 1 },
      "tst-2": {
        id: "tst-2", type: "section", displayName: "Testimonio 2",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a" },
        children: ["tst-2-stars", "tst-2-quote", "tst-2-author"], version: 1,
      },
      "tst-2-stars": { id: "tst-2-stars", type: "text", props: { content: "★★★★★", size: "md", color: "#fbbf24", align: "left" }, children: [], version: 1 },
      "tst-2-quote": {
        id: "tst-2-quote", type: "text", displayName: "Cita 2",
        props: { content: '"Profesionales, puntuales y muy claros en todo momento. Los recomiendo sin dudar."', size: "md", color: "#e2e8f0", align: "left" },
        children: [], version: 1,
      },
      "tst-2-author": { id: "tst-2-author", type: "text", props: { content: "— Carlos M., Empresario", size: "sm", color: "#818cf8", align: "left" }, children: [], version: 1 },
      "tst-3": {
        id: "tst-3", type: "section", displayName: "Testimonio 3",
        props: { maxWidth: "sm", paddingY: "md", paddingX: "md", background: "#0f172a" },
        children: ["tst-3-stars", "tst-3-quote", "tst-3-author"], version: 1,
      },
      "tst-3-stars": { id: "tst-3-stars", type: "text", props: { content: "★★★★★", size: "md", color: "#fbbf24", align: "left" }, children: [], version: 1 },
      "tst-3-quote": {
        id: "tst-3-quote", type: "text", displayName: "Cita 3",
        props: { content: '"El mejor equipo con el que hemos trabajado. Resultados reales y comunicación constante."', size: "md", color: "#e2e8f0", align: "left" },
        children: [], version: 1,
      },
      "tst-3-author": { id: "tst-3-author", type: "text", props: { content: "— Ana R., Gerente", size: "sm", color: "#818cf8", align: "left" }, children: [], version: 1 },

      // ── CONTACTO / CTA FINAL ──────────────────────────────────────────────
      "contacto-section": {
        id: "contacto-section", type: "section", displayName: "Contacto",
        props: { maxWidth: "md", paddingY: "xl", paddingX: "md", align: "center", background: "linear-gradient(135deg,#312e81 0%,#0f172a 100%)" },
        children: ["cta-title", "cta-sub", "cta-btn", "cta-note"], version: 1,
      },
      "cta-title": {
        id: "cta-title", type: "heading", displayName: "Título CTA",
        props: { text: "¿Listo para dar el siguiente paso?", level: 2, size: "4xl", weight: "extrabold", color: "#ffffff", align: "center", marginBottom: "sm" },
        children: [], version: 1,
      },
      "cta-sub": {
        id: "cta-sub", type: "text",
        props: { content: "Contáctanos hoy y recibe una consulta gratuita. Sin compromisos, solo resultados.", size: "lg", color: "#c7d2fe", align: "center", maxWidth: "md" },
        children: [], version: 1,
      },
      "cta-btn": {
        id: "cta-btn", type: "ctaButton", displayName: "Botón WhatsApp",
        props: { label: "Escribir por WhatsApp", href: "https://wa.me/5200000000", variant: "secondary", size: "lg" },
        children: [], version: 1,
      },
      "cta-note": {
        id: "cta-note", type: "text",
        props: { content: "Respuesta en menos de 24 horas · Lunes a Viernes 9:00–19:00", size: "sm", color: "#818cf8", align: "center" },
        children: [], version: 1,
      },
    },
  }
}

