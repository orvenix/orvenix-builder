import type { EditorTree } from "@/types/editor";
import { buildRichStarterTree } from "@/lib/starterTree";

export const WEB_IDS = [
  "ai-dashboard",
  "crm",
  "ecommerce",
  "project-manager",
  "landing",
  "modular-enterprise",
  "finance",
  "hr",
  "devops",
  "tienda",
  "servicios-locales",
  "arquitectura",
  "contabilidad",
  "viajes",
  "notaria",
  "rrhh",
  "restaurante",
  "clinica",
  "inmobiliaria",
  "agencia",
  "academia",
  "abogados",
  "gimnasio",
  "barberia",
  "hotel",
  "transporte",
] as const;

export type EditorWebId = (typeof WEB_IDS)[number];

export function isEditorWebId(value: string): value is EditorWebId {
  return (WEB_IDS as readonly string[]).includes(value);
}

export const WEB_LABELS: Record<EditorWebId, string> = {
  "ai-dashboard": "AI Analytics Dashboard",
  crm: "CRM Enterprise Platform",
  ecommerce: "E-Commerce Control Center",
  "project-manager": "Project Management Suite",
  landing: "SaaS Growth Engine",
  "modular-enterprise": "Modular Enterprise Website",
  finance: "Finance Dashboard",
  hr: "HR Management Suite",
  devops: "DevOps Monitor",
  tienda: "Tienda Online Pro",
  "servicios-locales": "Servicios Locales Pro",
  arquitectura: "Estudio de Arquitectura",
  contabilidad: "Despacho Contable & Fiscal",
  viajes: "Agencia de Viajes Premium",
  notaria: "Notaría Pública",
  rrhh: "Consultora de RRHH",
  restaurante: "Restaurante Gourmet Pro",
  clinica: "Clínica & Salud Digital",
  inmobiliaria: "Inmobiliaria Premium",
  agencia: "Agencia Digital 360",
  academia: "Academia EdTech Pro",
  abogados: "Despacho Jurídico Pro",
  gimnasio: "Gimnasio & Fitness Pro",
  barberia: "Barbería Premium",
  hotel: "Hotel Boutique Luxury",
  transporte: "Transporte Ejecutivo Pro",
};

function createPublicPageTree({
  id,
  badge,
  title,
  copy,
  cta,
  image,
  background,
  text,
  muted,
  accent,
  servicesTitle,
  servicesCopy,
  proofTitle,
  proofCopy,
}: {
  id: EditorWebId;
  badge: string;
  title: string;
  copy: string;
  cta: string;
  image: string;
  background: string;
  text: string;
  muted: string;
  accent: string;
  servicesTitle: string;
  servicesCopy: string;
  proofTitle: string;
  proofCopy: string;
}): EditorTree {
  const root = `${id}-editor-root`;
  const badgeId = `${id}-badge`;
  const titleId = `${id}-title`;
  const copyId = `${id}-copy`;
  const ctaId = `${id}-cta`;
  const imageId = `${id}-image`;
  const servicesTitleId = `${id}-services-title`;
  const servicesCopyId = `${id}-services-copy`;
  const servicesId = `${id}-services`;
  const proofTitleId = `${id}-proof-title`;
  const proofCopyId = `${id}-proof-copy`;
  const proofId = `${id}-proof`;

  return {
    rootId: root,
    nodes: {
      [root]: {
        id: root,
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background,
        },
        children: [
          badgeId,
          titleId,
          copyId,
          ctaId,
          imageId,
          servicesTitleId,
          servicesCopyId,
          servicesId,
          proofTitleId,
          proofCopyId,
          proofId,
        ],
        version: 1,
      },
      [badgeId]: {
        id: badgeId,
        type: "text",
        props: {
          content: badge,
          size: "sm",
          color: accent,
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      [titleId]: {
        id: titleId,
        type: "heading",
        props: {
          text: title,
          level: 1,
          size: "5xl",
          weight: "extrabold",
          color: text,
          align: "left",
        },
        children: [],
        version: 1,
      },
      [copyId]: {
        id: copyId,
        type: "text",
        props: {
          content: copy,
          size: "lg",
          color: muted,
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      [ctaId]: {
        id: ctaId,
        type: "ctaButton",
        props: {
          label: cta,
          href: "#contacto",
          variant: "primary",
          size: "md",
        },
        children: [],
        version: 1,
      },
      [imageId]: {
        id: imageId,
        type: "image",
        props: {
          src: image,
          alt: title,
          objectFit: "cover",
        },
        children: [],
        version: 1,
      },
      [servicesTitleId]: {
        id: servicesTitleId,
        type: "heading",
        props: {
          text: servicesTitle,
          level: 2,
          size: "3xl",
          weight: "extrabold",
          color: text,
          align: "left",
        },
        children: [],
        version: 1,
      },
      [servicesCopyId]: {
        id: servicesCopyId,
        type: "text",
        props: {
          content: servicesCopy,
          size: "md",
          color: muted,
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      [servicesId]: {
        id: servicesId,
        type: "agency-services",
        props: {},
        children: [],
        version: 1,
      },
      [proofTitleId]: {
        id: proofTitleId,
        type: "heading",
        props: {
          text: proofTitle,
          level: 2,
          size: "3xl",
          weight: "extrabold",
          color: text,
          align: "left",
        },
        children: [],
        version: 1,
      },
      [proofCopyId]: {
        id: proofCopyId,
        type: "text",
        props: {
          content: proofCopy,
          size: "md",
          color: muted,
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      [proofId]: {
        id: proofId,
        type: "agency-testimonials",
        props: {},
        children: [],
        version: 1,
      },
    },
  };
}

export const WEB_EDITOR_TREES: Record<EditorWebId, EditorTree> = {
  "ai-dashboard": {
    rootId: "ai-dashboard-root",
    nodes: {
      "ai-dashboard-root": {
        id: "ai-dashboard-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#050816",
        },
        children: [
          "ai-dashboard-badge",
          "ai-dashboard-title",
          "ai-dashboard-copy",
          "ai-dashboard-kpis",
          "ai-dashboard-charts",
          "ai-dashboard-insights",
        ],
        version: 1,
      },
      "ai-dashboard-badge": {
        id: "ai-dashboard-badge",
        type: "text",
        props: {
          content: "Overview · Abril 2026 · Datos en tiempo real",
          size: "sm",
          color: "#94a3b8",
        },
        children: [],
        version: 1,
      },
      "ai-dashboard-title": {
        id: "ai-dashboard-title",
        type: "heading",
        props: {
          text: "Business Overview",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#ffffff",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "ai-dashboard-copy": {
        id: "ai-dashboard-copy",
        type: "text",
        props: {
          content:
            "Dashboard real del vertical de analytics con KPI cards, revenue charts y actividad operativa.",
          size: "lg",
          color: "#cbd5e1",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "ai-dashboard-kpis": {
        id: "ai-dashboard-kpis",
        type: "ai-kpi-grid",
        props: {},
        children: [],
        version: 1,
      },
      "ai-dashboard-charts": {
        id: "ai-dashboard-charts",
        type: "ai-charts",
        props: {},
        children: [],
        version: 1,
      },
      "ai-dashboard-insights": {
        id: "ai-dashboard-insights",
        type: "ai-insights-stack",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  crm: {
    rootId: "crm-editor-root",
    nodes: {
      "crm-editor-root": {
        id: "crm-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#f8fafc",
        },
        children: [
          "crm-badge",
          "crm-title",
          "crm-copy",
          "crm-stats",
          "crm-contacts",
          "crm-pipeline",
        ],
        version: 1,
      },
      "crm-badge": {
        id: "crm-badge",
        type: "text",
        props: {
          content: "Vista real del CRM · tabla y pipeline",
          size: "sm",
          color: "#64748b",
        },
        children: [],
        version: 1,
      },
      "crm-title": {
        id: "crm-title",
        type: "heading",
        props: {
          text: "Contactos",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#0f172a",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "crm-copy": {
        id: "crm-copy",
        type: "text",
        props: {
          content:
            "Editor cargado con los módulos reales del CRM: métricas, tabla de contactos y pipeline de oportunidades.",
          size: "lg",
          color: "#475569",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "crm-stats": {
        id: "crm-stats",
        type: "crm-stats-row",
        props: {},
        children: [],
        version: 1,
      },
      "crm-contacts": {
        id: "crm-contacts",
        type: "crm-contacts-table",
        props: {},
        children: [],
        version: 1,
      },
      "crm-pipeline": {
        id: "crm-pipeline",
        type: "crm-pipeline-table",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  ecommerce: {
    rootId: "ecommerce-editor-root",
    nodes: {
      "ecommerce-editor-root": {
        id: "ecommerce-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#fffdf8",
        },
        children: [
          "ecommerce-badge",
          "ecommerce-title",
          "ecommerce-copy",
          "ecommerce-stats",
          "ecommerce-products",
          "ecommerce-orders",
        ],
        version: 1,
      },
      "ecommerce-badge": {
        id: "ecommerce-badge",
        type: "text",
        props: {
          content: "Tienda activa · catálogo y pedidos",
          size: "sm",
          color: "#92400e",
        },
        children: [],
        version: 1,
      },
      "ecommerce-title": {
        id: "ecommerce-title",
        type: "heading",
        props: {
          text: "Control Center",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#1f2937",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "ecommerce-copy": {
        id: "ecommerce-copy",
        type: "text",
        props: {
          content:
            "Canvas inicial con los componentes reales del e-commerce: stats, catálogo y tabla de pedidos.",
          size: "lg",
          color: "#6b7280",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "ecommerce-stats": {
        id: "ecommerce-stats",
        type: "ec-stats-bar",
        props: {},
        children: [],
        version: 1,
      },
      "ecommerce-products": {
        id: "ecommerce-products",
        type: "ec-product-grid",
        props: {},
        children: [],
        version: 1,
      },
      "ecommerce-orders": {
        id: "ecommerce-orders",
        type: "ec-orders-table",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  "project-manager": {
    rootId: "pm-editor-root",
    nodes: {
      "pm-editor-root": {
        id: "pm-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#06110d",
        },
        children: [
          "pm-badge",
          "pm-title",
          "pm-copy",
          "pm-list",
          "pm-board",
        ],
        version: 1,
      },
      "pm-badge": {
        id: "pm-badge",
        type: "text",
        props: {
          content: "Engineering · Sprint actual · Lista + Kanban",
          size: "sm",
          color: "#6ee7b7",
        },
        children: [],
        version: 1,
      },
      "pm-title": {
        id: "pm-title",
        type: "heading",
        props: {
          text: "Issue Management",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#ffffff",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "pm-copy": {
        id: "pm-copy",
        type: "text",
        props: {
          content:
            "Editor con las vistas reales del product manager: lista agrupada por estado y tablero kanban.",
          size: "lg",
          color: "#d1fae5",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "pm-list": {
        id: "pm-list",
        type: "pm-issue-list",
        props: {},
        children: [],
        version: 1,
      },
      "pm-board": {
        id: "pm-board",
        type: "pm-kanban-board",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  landing: {
    rootId: "landing-editor-root",
    nodes: {
      "landing-editor-root": {
        id: "landing-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "none",
          paddingX: "none",
          align: "center",
          background: "#040408",
        },
        children: [
          "landing-hero",
          "landing-features",
          "landing-testimonials",
          "landing-pricing",
          "landing-footer",
        ],
        version: 1,
      },
      "landing-hero": {
        id: "landing-hero",
        type: "landing-hero",
        props: {},
        children: [],
        version: 1,
      },
      "landing-features": {
        id: "landing-features",
        type: "landing-features",
        props: {},
        children: [],
        version: 1,
      },
      "landing-testimonials": {
        id: "landing-testimonials",
        type: "landing-testimonials",
        props: {},
        children: [],
        version: 1,
      },
      "landing-pricing": {
        id: "landing-pricing",
        type: "landing-pricing-real",
        props: {},
        children: [],
        version: 1,
      },
      "landing-footer": {
        id: "landing-footer",
        type: "landing-footer",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  "modular-enterprise": {
    rootId: "modular-enterprise-root",
    nodes: {
      "modular-enterprise-root": {
        id: "modular-enterprise-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "none",
          paddingX: "none",
          align: "left",
          background: "#ffffff",
        },
        children: [
          "modular-enterprise-hero",
          "modular-enterprise-trust",
          "modular-enterprise-capabilities",
          "modular-enterprise-architecture",
          "modular-enterprise-process",
          "modular-enterprise-contact",
          "modular-enterprise-footer",
        ],
        version: 1,
      },
      "modular-enterprise-hero": {
        id: "modular-enterprise-hero",
        type: "modular-hero",
        props: {
          eyebrow: "Arquitectura SaaS modular",
          title: "Una web empresarial lista para escalar, vender y operar",
          subtitle:
            "Sistema completo con secciones editables, narrativa comercial, componentes reutilizables y un flujo de contacto preparado para convertir oportunidades.",
          primaryCta: "Solicitar demo",
          secondaryCta: "Ver arquitectura",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-trust": {
        id: "modular-enterprise-trust",
        type: "modular-trust",
        props: {
          eyebrow: "Equipos que necesitan velocidad sin perder control",
          title: "Base escalable para marketing, ventas y operaciones",
          subtitle:
            "Pensada para crecer por modulos: cambia textos, reorganiza secciones y extiende bloques sin reescribir la web.",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-capabilities": {
        id: "modular-enterprise-capabilities",
        type: "modular-capabilities",
        props: {
          eyebrow: "Capacidades",
          title: "Secciones completas para una web que no se queda corta",
          subtitle:
            "Cada bloque resuelve una parte del funnel: posicionamiento, prueba, explicacion tecnica, proceso y contacto.",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-architecture": {
        id: "modular-enterprise-architecture",
        type: "modular-architecture",
        props: {
          eyebrow: "Arquitectura",
          title: "Preparada para integrarse con tu operacion real",
          subtitle:
            "Una estructura limpia para conectar formularios, CRM, analytics, automatizaciones y publicacion sin romper la experiencia visual.",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-process": {
        id: "modular-enterprise-process",
        type: "modular-process",
        props: {
          eyebrow: "Metodo",
          title: "De idea a web editable en cuatro movimientos",
          subtitle: "Un flujo claro para construir, validar y extender sin deuda visual.",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-contact": {
        id: "modular-enterprise-contact",
        type: "modular-contact-form",
        props: {
          eyebrow: "Contacto",
          title: "Cuéntanos qué quieres construir",
          subtitle:
            "Este formulario es interactivo en preview/publicacion y mantiene una experiencia sobria para captacion B2B.",
          submitLabel: "Enviar solicitud",
        },
        children: [],
        version: 1,
      },
      "modular-enterprise-footer": {
        id: "modular-enterprise-footer",
        type: "modular-footer",
        props: {
          title: "Orvenix Modular",
          subtitle: "Web enterprise editable, escalable y lista para integraciones.",
        },
        children: [],
        version: 1,
      },
    },
  },
  finance: {
    rootId: "finance-editor-root",
    nodes: {
      "finance-editor-root": {
        id: "finance-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#06110d",
        },
        children: ["finance-badge", "finance-title", "finance-copy", "finance-stats", "finance-portfolio", "finance-transactions"],
        version: 1,
      },
      "finance-badge": {
        id: "finance-badge",
        type: "text",
        props: {
          content: "Mayo 2026 · Portafolio consolidado",
          size: "sm",
          color: "#6ee7b7",
        },
        children: [],
        version: 1,
      },
      "finance-title": {
        id: "finance-title",
        type: "heading",
        props: {
          text: "Finance Overview",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#ffffff",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "finance-copy": {
        id: "finance-copy",
        type: "text",
        props: {
          content:
            "Editor cargado con los módulos reales de finanzas: KPIs, distribución de portfolio y tabla de transacciones.",
          size: "lg",
          color: "#d1fae5",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "finance-stats": {
        id: "finance-stats",
        type: "fin-stats",
        props: {},
        children: [],
        version: 1,
      },
      "finance-portfolio": {
        id: "finance-portfolio",
        type: "fin-portfolio",
        props: {},
        children: [],
        version: 1,
      },
      "finance-transactions": {
        id: "finance-transactions",
        type: "fin-transactions",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  hr: {
    rootId: "hr-editor-root",
    nodes: {
      "hr-editor-root": {
        id: "hr-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#120b04",
        },
        children: ["hr-badge", "hr-title", "hr-copy", "hr-stats", "hr-employees", "hr-recruitment"],
        version: 1,
      },
      "hr-badge": {
        id: "hr-badge",
        type: "text",
        props: {
          content: "People Overview · 284 empleados activos",
          size: "sm",
          color: "#fbbf24",
        },
        children: [],
        version: 1,
      },
      "hr-title": {
        id: "hr-title",
        type: "heading",
        props: {
          text: "HR Management Suite",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#ffffff",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "hr-copy": {
        id: "hr-copy",
        type: "text",
        props: {
          content:
            "Editor con los módulos reales de RRHH: KPIs, tabla de empleados y pipeline de reclutamiento.",
          size: "lg",
          color: "#fde68a",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "hr-stats": {
        id: "hr-stats",
        type: "hr-stats",
        props: {},
        children: [],
        version: 1,
      },
      "hr-employees": {
        id: "hr-employees",
        type: "hr-employees",
        props: {},
        children: [],
        version: 1,
      },
      "hr-recruitment": {
        id: "hr-recruitment",
        type: "hr-recruitment",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  devops: {
    rootId: "devops-editor-root",
    nodes: {
      "devops-editor-root": {
        id: "devops-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#03131a",
        },
        children: ["devops-badge", "devops-title", "devops-copy", "devops-servers", "devops-alerts", "devops-services"],
        version: 1,
      },
      "devops-badge": {
        id: "devops-badge",
        type: "text",
        props: {
          content: "Infrastructure Overview · monitoreo live",
          size: "sm",
          color: "#67e8f9",
        },
        children: [],
        version: 1,
      },
      "devops-title": {
        id: "devops-title",
        type: "heading",
        props: {
          text: "DevOps Monitor",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#ffffff",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "devops-copy": {
        id: "devops-copy",
        type: "text",
        props: {
          content:
            "Editor con la estructura real de observabilidad: servidores, alertas y estado de microservicios.",
          size: "lg",
          color: "#cffafe",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "devops-servers": {
        id: "devops-servers",
        type: "devops-servers",
        props: {},
        children: [],
        version: 1,
      },
      "devops-alerts": {
        id: "devops-alerts",
        type: "devops-alerts",
        props: {},
        children: [],
        version: 1,
      },
      "devops-services": {
        id: "devops-services",
        type: "devops-services",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  tienda: {
    rootId: "tienda-editor-root",
    nodes: {
      "tienda-editor-root": {
        id: "tienda-editor-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#f7f3ec",
        },
        children: [
          "tienda-badge",
          "tienda-title",
          "tienda-copy",
          "tienda-cta",
          "tienda-stats",
          "tienda-products",
          "tienda-orders",
        ],
        version: 1,
      },
      "tienda-badge": {
        id: "tienda-badge",
        type: "text",
        props: {
          content: "Storefront & Checkout · tienda lista para vender",
          size: "sm",
          color: "#92400e",
        },
        children: [],
        version: 1,
      },
      "tienda-title": {
        id: "tienda-title",
        type: "heading",
        props: {
          text: "Tienda Online Pro",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#1f2937",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "tienda-copy": {
        id: "tienda-copy",
        type: "text",
        props: {
          content:
            "Canvas inicial para una tienda editable con hero comercial, catálogo de productos, pedidos y estructura de checkout.",
          size: "lg",
          color: "#57534e",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "tienda-cta": {
        id: "tienda-cta",
        type: "ctaButton",
        props: {
          label: "Personalizar tienda",
          href: "#productos",
          variant: "primary",
          size: "md",
        },
        children: [],
        version: 1,
      },
      "tienda-stats": {
        id: "tienda-stats",
        type: "ec-stats-bar",
        props: {},
        children: [],
        version: 1,
      },
      "tienda-products": {
        id: "tienda-products",
        type: "ec-product-grid",
        props: {},
        children: [],
        version: 1,
      },
      "tienda-orders": {
        id: "tienda-orders",
        type: "ec-orders-table",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  "servicios-locales": {
    rootId: "servicios-locales-root",
    nodes: {
      "servicios-locales-root": {
        id: "servicios-locales-root",
        type: "section",
        props: {
          maxWidth: "full",
          paddingY: "lg",
          paddingX: "md",
          align: "left",
          background: "#f6f8fb",
        },
        children: [
          "servicios-locales-badge",
          "servicios-locales-title",
          "servicios-locales-copy",
          "servicios-locales-cta",
          "servicios-locales-services",
          "servicios-locales-testimonials",
        ],
        version: 1,
      },
      "servicios-locales-badge": {
        id: "servicios-locales-badge",
        type: "text",
        props: {
          content: "Servicios locales · agenda, cobertura y cotizacion",
          size: "sm",
          color: "#0e7490",
        },
        children: [],
        version: 1,
      },
      "servicios-locales-title": {
        id: "servicios-locales-title",
        type: "heading",
        props: {
          text: "Servicios Locales Pro",
          level: 1,
          size: "4xl",
          weight: "extrabold",
          color: "#0f172a",
          align: "left",
        },
        children: [],
        version: 1,
      },
      "servicios-locales-copy": {
        id: "servicios-locales-copy",
        type: "text",
        props: {
          content:
            "Base editable para negocios locales con hero, servicios, zonas de cobertura, proceso, resenas, FAQ y CTA a WhatsApp o agenda.",
          size: "lg",
          color: "#475569",
          align: "left",
          maxWidth: "lg",
        },
        children: [],
        version: 1,
      },
      "servicios-locales-cta": {
        id: "servicios-locales-cta",
        type: "ctaButton",
        props: {
          label: "Personalizar servicios",
          href: "#servicios",
          variant: "primary",
          size: "md",
        },
        children: [],
        version: 1,
      },
      "servicios-locales-services": {
        id: "servicios-locales-services",
        type: "agency-services",
        props: {},
        children: [],
        version: 1,
      },
      "servicios-locales-testimonials": {
        id: "servicios-locales-testimonials",
        type: "agency-testimonials",
        props: {},
        children: [],
        version: 1,
      },
    },
  },
  arquitectura: createPublicPageTree({
    id: "arquitectura",
    badge: "Arquitectura · portafolio, servicios y consulta",
    title: "Estudio de Arquitectura",
    copy:
      "Plantilla editable para estudios de arquitectura con portafolio, servicios, proceso, equipo, testimonios y formulario de consulta.",
    cta: "Personalizar arquitectura",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#0a0908",
    text: "#fff7ed",
    muted: "#d6d3d1",
    accent: "#b45309",
    servicesTitle: "Portafolio y servicios listos para vender",
    servicesCopy:
      "Edita especialidades, proyectos, proceso creativo y llamados a la acción para presentar un estudio de arquitectura con autoridad visual.",
    proofTitle: "Confianza para proyectos de alto valor",
    proofCopy:
      "Usa testimonios, métricas y casos destacados para reducir fricción y convertir consultas en proyectos.",
  }),
  contabilidad: createPublicPageTree({
    id: "contabilidad",
    badge: "Contabilidad · SAT, IMSS, fiscal y planes",
    title: "Despacho Contable & Fiscal",
    copy:
      "Plantilla editable para despachos contables con servicios fiscales, planes, equipo, proceso, testimonios y diagnóstico gratuito.",
    cta: "Personalizar contabilidad",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#ecfeff",
    text: "#0f172a",
    muted: "#475569",
    accent: "#0d9488",
    servicesTitle: "Servicios fiscales claros",
    servicesCopy:
      "Ajusta planes, obligaciones, beneficios y mensajes comerciales para convertir empresas en clientes recurrentes.",
    proofTitle: "Credibilidad financiera",
    proofCopy:
      "Presenta certificaciones, testimonios y proceso de trabajo para generar confianza desde la primera visita.",
  }),
  viajes: createPublicPageTree({
    id: "viajes",
    badge: "Viajes · paquetes, destinos y cotización",
    title: "Agencia de Viajes Premium",
    copy:
      "Plantilla editable para agencias de viajes con paquetes, destinos, asesores, proceso de reservación, testimonios y cotizador.",
    cta: "Personalizar viajes",
    image: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#fff7ed",
    text: "#1c1917",
    muted: "#78716c",
    accent: "#ea580c",
    servicesTitle: "Paquetes y destinos editables",
    servicesCopy:
      "Modifica destinos, precios, categorías de viaje y formularios para captar solicitudes calificadas.",
    proofTitle: "Experiencias que venden",
    proofCopy:
      "Usa reseñas y pruebas visuales para convertir visitantes en viajeros listos para reservar.",
  }),
  notaria: createPublicPageTree({
    id: "notaria",
    badge: "Notaría · trámites, tarifas y citas",
    title: "Notaría Pública",
    copy:
      "Plantilla editable para notarías con trámites, tarifas orientativas, equipo jurídico, proceso, testimonios y formulario de cita.",
    cta: "Personalizar notaría",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#0b0a08",
    text: "#fef3c7",
    muted: "#d6d3d1",
    accent: "#a16207",
    servicesTitle: "Trámites presentados con claridad",
    servicesCopy:
      "Edita procesos, requisitos, tiempos y formularios para facilitar la decisión del cliente.",
    proofTitle: "Autoridad jurídica",
    proofCopy:
      "Comunica experiencia, formalidad y confianza con una composición sobria y profesional.",
  }),
  rrhh: createPublicPageTree({
    id: "rrhh",
    badge: "RRHH · talento, cultura y consultoría",
    title: "Consultora de RRHH",
    copy:
      "Plantilla editable para consultoras de recursos humanos con servicios, casos de éxito, metodología, equipo y diagnóstico gratuito.",
    cta: "Personalizar RRHH",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#0b0714",
    text: "#ffffff",
    muted: "#c4b5fd",
    accent: "#7c3aed",
    servicesTitle: "Servicios de talento listos para vender",
    servicesCopy:
      "Ajusta reclutamiento, capacitación, cultura y métricas para presentar una consultoría clara y confiable.",
    proofTitle: "Resultados medibles",
    proofCopy:
      "Muestra casos, indicadores y testimonios para convertir interés en reuniones comerciales.",
  }),
  restaurante: createPublicPageTree({
    id: "restaurante",
    badge: "Gastronomía premium · reservas, menú y experiencia",
    title: "Restaurante Gourmet Pro",
    copy:
      "Plantilla editable para restaurantes de alta cocina con narrativa de marca, menú destacado, reservas, reseñas y secciones listas para convertir visitantes en comensales.",
    cta: "Personalizar restaurante",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#120b04",
    text: "#fff7ed",
    muted: "#fed7aa",
    accent: "#f59e0b",
    servicesTitle: "Una experiencia diseñada para reservas",
    servicesCopy:
      "Edita servicios, especialidades, menús, horarios y mensajes comerciales sin tocar código. La estructura está lista para una operación gastronómica real.",
    proofTitle: "Prueba social para generar confianza",
    proofCopy:
      "Usa testimonios, reseñas y mensajes de autoridad para reforzar reputación y aumentar conversiones desde la primera visita.",
  }),
  clinica: createPublicPageTree({
    id: "clinica",
    badge: "Healthcare · especialidades, doctores y cita online",
    title: "Clínica & Salud Digital",
    copy:
      "Plantilla editable para clínicas, consultorios y centros médicos con secciones para especialidades, proceso de atención, seguros, doctores y solicitud de cita.",
    cta: "Personalizar clínica",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#ecfeff",
    text: "#0f172a",
    muted: "#475569",
    accent: "#0f766e",
    servicesTitle: "Secciones listas para atención médica",
    servicesCopy:
      "Ajusta especialidades, beneficios, seguros aceptados y llamadas a la acción para convertir tráfico en citas confirmadas.",
    proofTitle: "Confianza clínica desde el diseño",
    proofCopy:
      "Presenta evidencia, testimonios y credenciales con una composición profesional pensada para servicios de salud.",
  }),
  inmobiliaria: createPublicPageTree({
    id: "inmobiliaria",
    badge: "Real estate · propiedades, agentes y captación",
    title: "Inmobiliaria Premium",
    copy:
      "Plantilla editable para inmobiliarias y brokers con hero de lujo, propiedades destacadas, valoración gratuita, agentes, proceso comercial y reporte de mercado.",
    cta: "Personalizar inmobiliaria",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#f8fafc",
    text: "#0f172a",
    muted: "#475569",
    accent: "#d97706",
    servicesTitle: "Base editable para vender propiedades",
    servicesCopy:
      "Modifica zonas, tipos de propiedad, argumentos de venta y llamados para captar compradores, vendedores o inversionistas.",
    proofTitle: "Autoridad para decisiones de alto valor",
    proofCopy:
      "Comunica experiencia, reputación y resultados con secciones pensadas para mercados inmobiliarios competitivos.",
  }),
  agencia: createPublicPageTree({
    id: "agencia",
    badge: "Agencia digital · servicios, casos y conversión",
    title: "Agencia Digital 360",
    copy:
      "Plantilla editable para estudios creativos y agencias de marketing con servicios, casos de éxito, proceso, planes, equipo y formulario de contacto.",
    cta: "Personalizar agencia",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#080815",
    text: "#ffffff",
    muted: "#cbd5e1",
    accent: "#00b5f6",
    servicesTitle: "Servicios editables para vender estrategia",
    servicesCopy:
      "Adapta la oferta, métricas, proceso y mensajes de venta para presentar una agencia moderna y orientada a resultados.",
    proofTitle: "Casos, confianza y cierre comercial",
    proofCopy:
      "Usa testimonios y bloques de prueba social para convertir interés en reuniones calificadas.",
  }),
  academia: createPublicPageTree({
    id: "academia",
    badge: "EdTech · cursos, rutas e instructores",
    title: "Academia EdTech Pro",
    copy:
      "Plantilla editable para academias, cursos y plataformas de formación con catálogo, rutas de aprendizaje, instructores, precios y testimonios.",
    cta: "Personalizar academia",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#eef2ff",
    text: "#111827",
    muted: "#4b5563",
    accent: "#4f46e5",
    servicesTitle: "Estructura lista para vender formación",
    servicesCopy:
      "Edita cursos, beneficios, rutas, instructores y planes para lanzar una academia con narrativa clara y conversiones medibles.",
    proofTitle: "Aprendizaje con prueba social",
    proofCopy:
      "Presenta resultados, comunidad e instructores para reducir fricción y aumentar inscripciones.",
  }),
  abogados: createPublicPageTree({
    id: "abogados",
    badge: "Derecho · laboral, mercantil, familiar, penal",
    title: "Despacho Jurídico Pro",
    copy:
      "Plantilla editable para despachos de abogados y firmas legales con áreas de práctica, equipo, proceso, testimonios y formulario de consulta gratuita.",
    cta: "Personalizar despacho",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#070b14",
    text: "#f1f5f9",
    muted: "#94a3b8",
    accent: "#d97706",
    servicesTitle: "Áreas de práctica editables",
    servicesCopy:
      "Edita especialidades jurídicas, equipo de abogados, proceso y argumentos de autoridad para presentar un despacho confiable y con credibilidad comprobable.",
    proofTitle: "Testimonios y casos ganados",
    proofCopy:
      "Usa reseñas verificadas y casos de éxito para reducir la fricción del cliente y posicionarte como la mejor opción legal en tu área.",
  }),
  gimnasio: createPublicPageTree({
    id: "gimnasio",
    badge: "Fitness · clases, membresías y entrenadores",
    title: "Gimnasio & Fitness Pro",
    copy:
      "Plantilla editable para gimnasios, boxes de CrossFit y centros de bienestar con clases, horarios, membresías, entrenadores, testimonios y formulario de prueba gratis.",
    cta: "Personalizar gimnasio",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#0d0d0d",
    text: "#ffffff",
    muted: "#a3a3a3",
    accent: "#ea580c",
    servicesTitle: "Clases y planes listos para vender",
    servicesCopy:
      "Edita disciplinas, horario semanal, membresías y precios para lanzar o escalar un gimnasio con una narrativa orientada a resultados y conversiones.",
    proofTitle: "Resultados que convencen",
    proofCopy:
      "Presenta testimonios reales, transformaciones y estadísticas del gimnasio para reducir la fricción del prospecto y acelerar la toma de decisión.",
  }),
  barberia: createPublicPageTree({
    id: "barberia",
    badge: "Barbería · cortes, barba, reservas y galería",
    title: "Barbería Premium",
    copy:
      "Plantilla editable para barberías y peluquerías con servicios y precios, galería de trabajos, equipo de barberos, sistema de reservas y reseñas de clientes.",
    cta: "Personalizar barbería",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#111009",
    text: "#fef3c7",
    muted: "#d97706",
    accent: "#b45309",
    servicesTitle: "Servicios y precios editables",
    servicesCopy:
      "Adapta la carta de servicios, precios, barberos y horarios para presentar una barbería con identidad propia y flujo de reservas optimizado.",
    proofTitle: "Galería y reputación",
    proofCopy:
      "Muestra el portfolio de trabajos y reseñas de clientes para construir la reputación que convierte visitantes en clientes recurrentes.",
  }),
  hotel: createPublicPageTree({
    id: "hotel",
    badge: "Hospitalidad · habitaciones, spa y reservas",
    title: "Hotel Boutique Luxury",
    copy:
      "Plantilla editable para hoteles boutique y posadas de lujo con habitaciones, servicios, galería, reseñas de huéspedes y formulario de reserva directa.",
    cta: "Personalizar hotel",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#faf8f5",
    text: "#1a1410",
    muted: "#78716c",
    accent: "#d97706",
    servicesTitle: "Habitaciones y amenidades editables",
    servicesCopy:
      "Edita tipos de habitación, precios por noche, servicios del hotel y disponibilidad para presentar una propiedad boutique que convierte visitas en reservas directas.",
    proofTitle: "Reseñas que generan confianza",
    proofCopy:
      "Presenta valoraciones reales de huéspedes para construir autoridad y posicionar el hotel como la mejor opción en su mercado de lujo.",
  }),
  transporte: createPublicPageTree({
    id: "transporte",
    badge: "Transporte · ejecutivo, aeropuerto y eventos",
    title: "Transporte Ejecutivo Pro",
    copy:
      "Plantilla editable para empresas de transporte ejecutivo con servicios, flotilla, zonas de cobertura, tarifas, formulario de cotización y testimonios corporativos.",
    cta: "Personalizar transporte",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=720&fit=crop&crop=center&q=85&auto=format",
    background: "#08111f",
    text: "#f1f5f9",
    muted: "#94a3b8",
    accent: "#2563eb",
    servicesTitle: "Servicios y flotilla editables",
    servicesCopy:
      "Adapta la oferta de traslados, vehículos disponibles, zonas de cobertura y paquetes para posicionar una empresa de transporte premium y captar clientes corporativos.",
    proofTitle: "Confianza corporativa comprobable",
    proofCopy:
      "Usa testimonios de empresas y particulares para demostrar puntualidad, profesionalismo y convertir cotizaciones en contratos recurrentes.",
  }),
};

export function getEditorTreeForWeb(id: EditorWebId): EditorTree {
  return WEB_EDITOR_TREES[id];
}

export const DEFAULT_STARTER_WEB_ID: EditorWebId = "servicios-locales";

export function getDefaultStarterEditorTree(): EditorTree {
  return buildRichStarterTree();
}
