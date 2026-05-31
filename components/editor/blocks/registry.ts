import type { ComponentType } from "react";
import type { EditorBlockDefinition, SettingsField } from "@/types/editor";
import { Section } from "@/components/section/Section";
import { Heading } from "@/components/editor/primitives/Heading";
import { Text } from "@/components/editor/primitives/Text";
import { CtaButton } from "@/components/editor/primitives/CtaButton";
import { SiteNav } from "@/components/editor/primitives/SiteNav";
import { Image } from "@/components/editor/primitives/Image";
import { GenericWrapper } from "@/components/editor/primitives/GenericWrapper";
import { StatsBar } from "./StatsBar";
import { ProductGrid } from "./ProductGrid";
import { CrmPipeline } from "./CrmPipeline";
import { AiMetricsGrid } from "./AiMetricsGrid";
import { SaasPricing } from "./SaasPricing";
import { AgencyHero } from "./AgencyHero";
import { AgencyServices } from "./AgencyServices";
import { AgencyTestimonials } from "./AgencyTestimonials";
import { AgencyCta } from "./AgencyCta";
import {
  ModularArchitecture,
  ModularCapabilities,
  ModularContactForm,
  ModularFooter,
  ModularHero,
  ModularProcess,
  ModularTrustBar,
} from "./ModularEnterpriseBlocks";
import {
  AiChartsBlock,
  AiInsightsBlock,
  AiKpiGridBlock,
  CrmContactsBlock,
  CrmPipelineBlock,
  CrmStatsBlock,
  EcommerceOrdersBlock,
  LandingFeaturesBlock,
  LandingFooterBlock,
  LandingHeroBlock,
  LandingPricingBlock,
  LandingTestimonialsBlock,
  ProjectIssueListBlock,
  ProjectKanbanBlock,
  FinanceStatsBlock,
  FinanceTransactionsBlock,
  FinancePortfolioBlock,
  HRStatsBlock,
  HREmployeeTableBlock,
  HRRecruitmentBlock,
  DevOpsServerGridBlock,
  DevOpsAlertsBlock,
  DevOpsServicesBlock,
} from "./RealWebBlocks";
import { ecommerceBlockDefinitions, storeBlockDefinitions, EC_CATEGORY } from "./ecommerce";
import { verticalBlockDefinitions, VERTICAL_CATEGORIES } from "./verticals";

// ============================================================
// Presets reutilizables
// ============================================================

const COLOR_PRESETS = [
  "#0f172a", "#1e293b", "#475569", "#94a3b8",
  "#ffffff", "#f1f5f9", "#fef3c7",
  "#6366f1", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#22c55e", "#06b6d4",
] as const;

const ALIGN_OPTIONS = [
  { value: "left", label: "Izquierda", icon: "AlignLeft" },
  { value: "center", label: "Centro", icon: "AlignCenter" },
  { value: "right", label: "Derecha", icon: "AlignRight" },
] as const;

const ENTERPRISE_CATEGORY = {
  key: "enterprise",
  label: "Enterprise Modular",
} as const;

const FINANCE_CATEGORY = { key: "finance", label: "Finance Dashboard" } as const;
const HR_CATEGORY = { key: "hr", label: "HR Management" } as const;
const DEVOPS_CATEGORY = { key: "devops", label: "DevOps & Infra" } as const;

// ============================================================
// Settings de cada bloque
// ============================================================

const sectionSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Disposición",
    fields: [
      {
        kind: "select",
        key: "maxWidth",
        label: "Ancho máximo",
        options: [
          { value: "sm", label: "Estrecho" },
          { value: "md", label: "Medio" },
          { value: "lg", label: "Amplio" },
          { value: "xl", label: "Extra amplio" },
          { value: "full", label: "Completo" },
        ],
      },
      {
        kind: "select",
        key: "paddingY",
        label: "Espaciado vertical",
        options: [
          { value: "none", label: "Ninguno" },
          { value: "sm", label: "Compacto" },
          { value: "md", label: "Medio" },
          { value: "lg", label: "Amplio" },
          { value: "xl", label: "Muy amplio" },
        ],
      },
      {
        kind: "segmented",
        key: "align",
        label: "Alineación",
        options: ALIGN_OPTIONS,
      },
    ],
  },
  {
    kind: "group",
    label: "Espaciado",
    fields: [
      {
        kind: "select",
        key: "paddingX",
        label: "Padding horizontal",
        options: [
          { value: "none", label: "Ninguno" },
          { value: "sm", label: "Compacto" },
          { value: "md", label: "Medio" },
          { value: "lg", label: "Amplio" },
          { value: "xl", label: "Muy amplio" },
        ],
      },
      {
        kind: "select",
        key: "marginY",
        label: "Margen vertical",
        options: [
          { value: "none", label: "Ninguno" },
          { value: "sm", label: "Compacto" },
          { value: "md", label: "Medio" },
          { value: "lg", label: "Amplio" },
          { value: "xl", label: "Muy amplio" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Efectos",
    fields: [
      {
        kind: "select",
        key: "shadow",
        label: "Sombra",
        options: [
          { value: "none", label: "Ninguna" },
          { value: "sm", label: "Sutil" },
          { value: "md", label: "Media" },
          { value: "lg", label: "Grande" },
          { value: "xl", label: "Muy grande" },
        ],
      },
      {
        kind: "select",
        key: "borderRadius",
        label: "Bordes redondeados",
        options: [
          { value: "none", label: "Ninguno" },
          { value: "sm", label: "Pequeño" },
          { value: "md", label: "Medio" },
          { value: "lg", label: "Grande" },
          { value: "xl", label: "Muy grande" },
        ],
      },
    ],
  },
  {
    kind: "group",
    label: "Responsive",
    fields: [
      {
        kind: "select",
        key: "mobileAlign",
        label: "Alineación móvil",
        options: ALIGN_OPTIONS,
      },
      {
        kind: "select",
        key: "tabletAlign",
        label: "Alineación tablet",
        options: ALIGN_OPTIONS,
      },
    ],
  },
];

const headingSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      {
        kind: "textarea",
        key: "text",
        label: "Texto",
        placeholder: "Escribe el título…",
        rows: 2,
        maxLength: 200,
      },
    ],
  },
  {
    kind: "group",
    label: "Tipografía",
    fields: [
      {
        kind: "select",
        key: "level",
        label: "Nivel (SEO)",
        help: "Afecta la jerarquía semántica y el SEO",
        options: [
          { value: 1, label: "H1 — Título principal" },
          { value: 2, label: "H2 — Sección" },
          { value: 3, label: "H3 — Subsección" },
          { value: 4, label: "H4" },
          { value: 5, label: "H5" },
          { value: 6, label: "H6" },
        ],
      },
      {
        kind: "select",
        key: "size",
        label: "Tamaño visual",
        options: [
          { value: "md", label: "Mediano" },
          { value: "lg", label: "Grande" },
          { value: "xl", label: "XL" },
          { value: "2xl", label: "2XL" },
          { value: "3xl", label: "3XL" },
          { value: "4xl", label: "4XL" },
          { value: "5xl", label: "5XL" },
        ],
      },
      {
        kind: "select",
        key: "weight",
        label: "Peso",
        options: [
          { value: "normal", label: "Normal" },
          { value: "medium", label: "Medio" },
          { value: "semibold", label: "Semi-bold" },
          { value: "bold", label: "Bold" },
          { value: "extrabold", label: "Extra bold" },
        ],
      },
      {
        kind: "segmented",
        key: "align",
        label: "Alineación",
        options: ALIGN_OPTIONS,
      },
      {
        kind: "color",
        key: "color",
        label: "Color",
        presets: COLOR_PRESETS,
      },
    ],
  },
];

const textSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      {
        kind: "textarea",
        key: "content",
        label: "Texto",
        placeholder: "Escribe el párrafo…",
        rows: 5,
        maxLength: 2000,
      },
    ],
  },
  {
    kind: "group",
    label: "Estilo",
    fields: [
      {
        kind: "segmented",
        key: "size",
        label: "Tamaño",
        options: [
          { value: "sm", label: "S" },
          { value: "md", label: "M" },
          { value: "lg", label: "L" },
        ],
      },
      {
        kind: "segmented",
        key: "align",
        label: "Alineación",
        options: ALIGN_OPTIONS,
      },
      {
        kind: "color",
        key: "color",
        label: "Color",
        presets: COLOR_PRESETS,
      },
    ],
  },
];

const buttonSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      {
        kind: "text",
        key: "label",
        label: "Texto del botón",
        placeholder: "Empezar",
        maxLength: 60,
      },
      {
        kind: "text",
        key: "href",
        label: "Enlace",
        placeholder: "/contacto, https://… o page:servicios",
      },
    ],
  },
  {
    kind: "group",
    label: "Estilo",
    fields: [
      {
        kind: "segmented",
        key: "variant",
        label: "Variante",
        options: [
          { value: "primary", label: "Principal" },
          { value: "secondary", label: "Secundario" },
          { value: "ghost", label: "Fantasma" },
        ],
      },
      {
        kind: "segmented",
        key: "size",
        label: "Tamaño",
        options: [
          { value: "sm", label: "S" },
          { value: "md", label: "M" },
          { value: "lg", label: "L" },
        ],
      },
    ],
  },
];

const siteNavSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      {
        kind: "text",
        key: "title",
        label: "Etiqueta accesible",
        placeholder: "Navegación principal",
        maxLength: 80,
      },
      {
        kind: "toggle",
        key: "showHome",
        label: "Mostrar Inicio",
      },
      {
        kind: "text",
        key: "hiddenSlugs",
        label: "Ocultar slugs",
        placeholder: "blog, contacto-interno",
      },
    ],
  },
  {
    kind: "group",
    label: "Layout",
    fields: [
      {
        kind: "segmented",
        key: "layout",
        label: "Dirección",
        options: [
          { value: "row", label: "Fila" },
          { value: "column", label: "Columna" },
        ],
      },
      {
        kind: "segmented",
        key: "justify",
        label: "Alineación",
        options: [
          { value: "start", label: "Inicio" },
          { value: "center", label: "Centro" },
          { value: "end", label: "Final" },
        ],
      },
      {
        kind: "segmented",
        key: "variant",
        label: "Estilo",
        options: [
          { value: "pill", label: "Pastilla" },
          { value: "minimal", label: "Minimal" },
        ],
      },
    ],
  },
];

const imageSettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      {
        kind: "image",
        key: "src",
        label: "Imagen",
        clearable: false,
      },
      {
        kind: "text",
        key: "alt",
        label: "Texto alternativo",
        placeholder: "Descripción de la imagen",
        maxLength: 200,
      },
    ],
  },
  {
    kind: "group",
    label: "Estilo",
    fields: [
      {
        kind: "select",
        key: "objectFit",
        label: "Ajuste de imagen",
        options: [
          { value: "cover", label: "Cubrir" },
          { value: "contain", label: "Contener" },
          { value: "fill", label: "Rellenar" },
          { value: "none", label: "Ninguno" },
          { value: "scale-down", label: "Escalar abajo" },
        ],
      },
    ],
  },
];

const enterpriseCopySettings: SettingsField[] = [
  {
    kind: "group",
    label: "Contenido",
    fields: [
      { kind: "text", key: "eyebrow", label: "Etiqueta" },
      { kind: "textarea", key: "title", label: "Titulo", rows: 2, maxLength: 160 },
      { kind: "textarea", key: "subtitle", label: "Descripcion", rows: 3, maxLength: 280 },
    ],
  },
];

const enterpriseHeroSettings: SettingsField[] = [
  ...enterpriseCopySettings,
  {
    kind: "group",
    label: "CTAs",
    fields: [
      { kind: "text", key: "primaryCta", label: "CTA principal" },
      { kind: "text", key: "secondaryCta", label: "CTA secundario" },
    ],
  },
];

const enterpriseContactSettings: SettingsField[] = [
  ...enterpriseCopySettings,
  {
    kind: "group",
    label: "Formulario",
    fields: [
      { kind: "text", key: "submitLabel", label: "Texto del boton" },
    ],
  },
];

// ============================================================
// Registry
// ============================================================

export const blockRegistry: Record<string, EditorBlockDefinition> = {
  section: {
    type: "section",
    label: "Sección",
    component: Section,
    defaults: Section.defaults,
    acceptsChildren: true,
    version: 1,
    category: "layout",
    icon: "LayoutGrid",
    description: "Contenedor para agrupar contenido",
    settings: sectionSettings,
  },
  heading: {
    type: "heading",
    label: "Título",
    component: Heading,
    defaults: Heading.defaults,
    acceptsChildren: false,
    version: 1,
    category: "content",
    icon: "Heading",
    description: "Encabezado destacado (h1–h6)",
    settings: headingSettings,
  },
  text: {
    type: "text",
    label: "Texto",
    component: Text,
    defaults: Text.defaults,
    acceptsChildren: false,
    version: 1,
    category: "content",
    icon: "Type",
    description: "Párrafo de texto",
    settings: textSettings,
  },
  ctaButton: {
    type: "ctaButton",
    label: "Botón",
    component: CtaButton,
    defaults: CtaButton.defaults,
    acceptsChildren: false,
    version: 1,
    category: "action",
    icon: "MousePointerClick",
    description: "Llamada a la acción",
    settings: buttonSettings,
  },
  siteNav: {
    type: "siteNav",
    label: "Navegación del sitio",
    component: SiteNav,
    defaults: SiteNav.defaults,
    acceptsChildren: false,
    version: 1,
    category: "layout",
    icon: "Navigation",
    description: "Menú automático conectado a las páginas del sitio",
    settings: siteNavSettings,
  },
  image: {
    type: "image",
    label: "Imagen",
    component: Image as unknown as ComponentType<unknown>,
    defaults: Image.defaults,
    acceptsChildren: false,
    version: 1,
    category: "content",
    icon: "Image",
    description: "Imagen o foto",
    settings: imageSettings,
  },
  genericWrapper: {
    type: "genericWrapper",
    label: "Componente Importado",
    component: GenericWrapper as unknown as ComponentType<unknown>,
    defaults: GenericWrapper.defaults,
    acceptsChildren: true,
    version: 1,
    category: "content",
    icon: "Box",
    description: "Componente importado de página externa",
    settings: [],
  }, 
  // E-commerce blocks
  "ec-stats-bar": {
    type: "ec-stats-bar",
    component: StatsBar,
    defaults: StatsBar.defaults,
    acceptsChildren: false,
    version: 1,
    ...ecommerceBlockDefinitions["ec-stats-bar"], // Merge metadata and settings
  },
  "ec-product-grid": {
    type: "ec-product-grid",
    component: ProductGrid,
    defaults: ProductGrid.defaults,
    acceptsChildren: false,
    version: 1,
    ...ecommerceBlockDefinitions["ec-product-grid"], // Merge metadata and settings
  },
  // ── Bloques de tienda real ────────────────────────────────────────
  "store-cart-drawer": {
    type: "store-cart-drawer",
    acceptsChildren: false,
    version: 1,
    ...storeBlockDefinitions["store-cart-drawer"],
  },
  "store-cart-button": {
    type: "store-cart-button",
    acceptsChildren: false,
    version: 1,
    ...storeBlockDefinitions["store-cart-button"],
  },
  "store-product-card": {
    type: "store-product-card",
    acceptsChildren: false,
    version: 1,
    ...storeBlockDefinitions["store-product-card"],
  },

  // New Vertical Blocks
  "ai-metrics-grid": {
    type: "ai-metrics-grid",
    component: AiMetricsGrid,
    defaults: AiMetricsGrid.defaults,
    acceptsChildren: false,
    version: 1,
    ...verticalBlockDefinitions["ai-metrics-grid"],
  },
  "crm-pipeline": {
    type: "crm-pipeline",
    component: CrmPipeline,
    defaults: CrmPipeline.defaults,
    acceptsChildren: false,
    version: 1,
    ...verticalBlockDefinitions["crm-pipeline"],
  },
  "pm-kanban": {
    type: "pm-kanban",
    component: CrmPipeline, // Reutilizamos el engine de Pipeline pero con defaults de PM
    defaults: { stages: 4, enableAiScoring: false },
    acceptsChildren: false,
    version: 1,
    ...verticalBlockDefinitions["pm-kanban"],
  },
  "saas-pricing": {
    type: "saas-pricing",
    component: SaasPricing,
    defaults: SaasPricing.defaults,
    acceptsChildren: false,
    version: 1,
    ...verticalBlockDefinitions["saas-pricing"],
  },
  "ai-kpi-grid": {
    type: "ai-kpi-grid",
    component: AiKpiGridBlock,
    defaults: AiKpiGridBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.analytics.key,
    label: "AI KPI Grid",
    icon: "PanelsTopLeft",
    description: "KPI cards reales del dashboard de analytics",
    settings: [],
  },
  "ai-charts": {
    type: "ai-charts",
    component: AiChartsBlock,
    defaults: AiChartsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.analytics.key,
    label: "AI Charts",
    icon: "ChartSpline",
    description: "Revenue chart y fuentes de tráfico reales",
    settings: [],
  },
  "ai-insights-stack": {
    type: "ai-insights-stack",
    component: AiInsightsBlock,
    defaults: AiInsightsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.analytics.key,
    label: "AI Activity + Insights",
    icon: "BrainCircuit",
    description: "Actividad operativa e insights de IA reales",
    settings: [],
  },
  "crm-stats-row": {
    type: "crm-stats-row",
    component: CrmStatsBlock,
    defaults: CrmStatsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.crm.key,
    label: "CRM Stats Row",
    icon: "LayoutDashboard",
    description: "Métricas reales del CRM",
    settings: [],
  },
  "crm-contacts-table": {
    type: "crm-contacts-table",
    component: CrmContactsBlock,
    defaults: CrmContactsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.crm.key,
    label: "CRM Contact Table",
    icon: "TableProperties",
    description: "Tabla real de contactos",
    settings: [],
  },
  "crm-pipeline-table": {
    type: "crm-pipeline-table",
    component: CrmPipelineBlock,
    defaults: CrmPipelineBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.crm.key,
    label: "CRM Pipeline",
    icon: "KanbanSquare",
    description: "Pipeline real de oportunidades",
    settings: [],
  },
  "ec-orders-table": {
    type: "ec-orders-table",
    component: EcommerceOrdersBlock,
    defaults: EcommerceOrdersBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: EC_CATEGORY.key,
    label: "Orders Table",
    icon: "ReceiptText",
    description: "Tabla real de pedidos recientes",
    settings: [],
  },
  "pm-issue-list": {
    type: "pm-issue-list",
    component: ProjectIssueListBlock,
    defaults: ProjectIssueListBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.productivity.key,
    label: "Issue List",
    icon: "ListTodo",
    description: "Lista real de issues del sprint",
    settings: [],
  },
  "pm-kanban-board": {
    type: "pm-kanban-board",
    component: ProjectKanbanBlock,
    defaults: ProjectKanbanBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.productivity.key,
    label: "Kanban Board",
    icon: "KanbanSquareDashed",
    description: "Tablero real del project manager",
    settings: [],
  },
  "landing-hero": {
    type: "landing-hero",
    component: LandingHeroBlock,
    defaults: LandingHeroBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.marketing.key,
    label: "Landing Hero",
    icon: "PanelsTopLeft",
    description: "Hero real de la landing SaaS",
    settings: [],
  },
  "landing-features": {
    type: "landing-features",
    component: LandingFeaturesBlock,
    defaults: LandingFeaturesBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.marketing.key,
    label: "Landing Features",
    icon: "LayoutGrid",
    description: "Sección real de capacidades",
    settings: [],
  },
  "landing-testimonials": {
    type: "landing-testimonials",
    component: LandingTestimonialsBlock,
    defaults: LandingTestimonialsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.marketing.key,
    label: "Landing Testimonials",
    icon: "MessageSquareQuote",
    description: "Testimonios reales de la landing",
    settings: [],
  },
  "landing-pricing-real": {
    type: "landing-pricing-real",
    component: LandingPricingBlock,
    defaults: LandingPricingBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.marketing.key,
    label: "Landing Pricing",
    icon: "BadgeDollarSign",
    description: "Pricing real de la landing",
    settings: [],
  },
  "landing-footer": {
    type: "landing-footer",
    component: LandingFooterBlock,
    defaults: LandingFooterBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: VERTICAL_CATEGORIES.marketing.key,
    label: "Landing Footer",
    icon: "Rows3",
    description: "Footer real de la landing",
    settings: [],
  },
  "agency-hero": {
    type: "agency-hero",
    component: AgencyHero,
    defaults: AgencyHero.defaults,
    acceptsChildren: false,
    version: 1,
    category: "marketing",
    label: "Agency Hero",
    icon: "Rocket",
    description: "Hero premium para agencias y estudios",
    settings: [],
  },
  "agency-services": {
    type: "agency-services",
    component: AgencyServices,
    defaults: AgencyServices.defaults,
    acceptsChildren: false,
    version: 1,
    category: "content",
    label: "Grilla de Servicios",
    icon: "LayoutGrid",
    description: "Servicios destacados en formato de grilla",
    settings: [],
  },
  "agency-testimonials": {
    type: "agency-testimonials",
    component: AgencyTestimonials,
    defaults: AgencyTestimonials.defaults,
    acceptsChildren: false,
    version: 1,
    category: "content",
    label: "Testimonios Premium",
    icon: "MessageSquareQuote",
    description: "Prueba social con testimonios de clientes",
    settings: [],
  },
  "agency-cta": {
    type: "agency-cta",
    component: AgencyCta,
    defaults: AgencyCta.defaults,
    acceptsChildren: false,
    version: 1,
    category: "action",
    label: "WhatsApp CTA",
    icon: "MessageCircle",
    description: "Llamada a la accion conectada a WhatsApp",
    settings: [
      { kind: "text", key: "phoneNumber", label: "Número de WhatsApp" }
    ],
  },
  "modular-hero": {
    type: "modular-hero",
    component: ModularHero,
    defaults: ModularHero.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Modular Hero",
    icon: "Rocket",
    description: "Hero enterprise con CTAs y panel de arquitectura",
    settings: enterpriseHeroSettings,
  },
  "modular-trust": {
    type: "modular-trust",
    component: ModularTrustBar,
    defaults: ModularTrustBar.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Trust Bar Modular",
    icon: "BadgeCheck",
    description: "Barra de posicionamiento y prueba de confianza",
    settings: enterpriseCopySettings,
  },
  "modular-capabilities": {
    type: "modular-capabilities",
    component: ModularCapabilities,
    defaults: ModularCapabilities.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Capabilities Grid",
    icon: "LayoutGrid",
    description: "Grilla de capacidades para SaaS enterprise",
    settings: enterpriseCopySettings,
  },
  "modular-architecture": {
    type: "modular-architecture",
    component: ModularArchitecture,
    defaults: ModularArchitecture.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Architecture Section",
    icon: "Network",
    description: "Seccion tecnica con integraciones y flujo modular",
    settings: enterpriseCopySettings,
  },
  "modular-process": {
    type: "modular-process",
    component: ModularProcess,
    defaults: ModularProcess.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Process Steps",
    icon: "Workflow",
    description: "Proceso comercial en pasos editables",
    settings: enterpriseCopySettings,
  },
  "modular-contact-form": {
    type: "modular-contact-form",
    component: ModularContactForm,
    defaults: ModularContactForm.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Formulario Interactivo",
    icon: "MailPlus",
    description: "Formulario B2B interactivo para captacion",
    settings: enterpriseContactSettings,
  },
  "modular-footer": {
    type: "modular-footer",
    component: ModularFooter,
    defaults: ModularFooter.defaults,
    acceptsChildren: false,
    version: 1,
    category: ENTERPRISE_CATEGORY.key,
    label: "Footer Modular",
    icon: "Rows3",
    description: "Footer simple y escalable",
    settings: [
      {
        kind: "group",
        label: "Contenido",
        fields: [
          { kind: "text", key: "title", label: "Titulo" },
          { kind: "textarea", key: "subtitle", label: "Descripcion", rows: 2 },
        ],
      },
    ],
  },

  // ── Finance Dashboard ──────────────────────────────────────
  "fin-stats": {
    type: "fin-stats",
    component: FinanceStatsBlock,
    defaults: FinanceStatsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: FINANCE_CATEGORY.key,
    label: "Finance KPIs",
    icon: "TrendingUp",
    description: "4 KPIs financieros: portfolio, P&L, activos y liquidez",
    settings: [],
  },
  "fin-transactions": {
    type: "fin-transactions",
    component: FinanceTransactionsBlock,
    defaults: FinanceTransactionsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: FINANCE_CATEGORY.key,
    label: "Transaction Table",
    icon: "ArrowLeftRight",
    description: "Tabla de transacciones con estado y categoría",
    settings: [],
  },
  "fin-portfolio": {
    type: "fin-portfolio",
    component: FinancePortfolioBlock,
    defaults: FinancePortfolioBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: FINANCE_CATEGORY.key,
    label: "Portfolio & P&L",
    icon: "PieChart",
    description: "Distribución de activos y gráfico de P&L mensual",
    settings: [],
  },

  // ── HR Management ──────────────────────────────────────────
  "hr-stats": {
    type: "hr-stats",
    component: HRStatsBlock,
    defaults: HRStatsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: HR_CATEGORY.key,
    label: "HR KPIs",
    icon: "Users",
    description: "4 KPIs de RRHH: headcount, contrataciones, rotación y satisfacción",
    settings: [],
  },
  "hr-employees": {
    type: "hr-employees",
    component: HREmployeeTableBlock,
    defaults: HREmployeeTableBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: HR_CATEGORY.key,
    label: "Employee Table",
    icon: "Table2",
    description: "Tabla de empleados con departamento, estado y rendimiento",
    settings: [],
  },
  "hr-recruitment": {
    type: "hr-recruitment",
    component: HRRecruitmentBlock,
    defaults: HRRecruitmentBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: HR_CATEGORY.key,
    label: "Recruitment Pipeline",
    icon: "UserPlus",
    description: "Pipeline de candidatos por etapa de selección",
    settings: [],
  },

  // ── DevOps & Infra ─────────────────────────────────────────
  "devops-servers": {
    type: "devops-servers",
    component: DevOpsServerGridBlock,
    defaults: DevOpsServerGridBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: DEVOPS_CATEGORY.key,
    label: "Server Grid",
    icon: "Server",
    description: "Grid de servidores con CPU, RAM, disco y estado",
    settings: [],
  },
  "devops-alerts": {
    type: "devops-alerts",
    component: DevOpsAlertsBlock,
    defaults: DevOpsAlertsBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: DEVOPS_CATEGORY.key,
    label: "Alert Feed",
    icon: "AlertTriangle",
    description: "Feed de alertas activas por severidad",
    settings: [],
  },
  "devops-services": {
    type: "devops-services",
    component: DevOpsServicesBlock,
    defaults: DevOpsServicesBlock.defaults,
    acceptsChildren: false,
    version: 1,
    category: DEVOPS_CATEGORY.key,
    label: "Service Status",
    icon: "Activity",
    description: "Estado y latencia de todos los microservicios",
    settings: [],
  },
};


export type RegisteredBlockType = keyof typeof blockRegistry;

export function getBlockDefinition(type: string): EditorBlockDefinition | null {
  return (blockRegistry as Record<string, EditorBlockDefinition>)[type] ?? null;
}

export const CATEGORY_ORDER: EditorBlockDefinition["category"][] = [
  "layout",
  "content",
  "action",
  EC_CATEGORY.key,
  VERTICAL_CATEGORIES.analytics.key,
  VERTICAL_CATEGORIES.crm.key,
  VERTICAL_CATEGORIES.productivity.key,
  VERTICAL_CATEGORIES.marketing.key,
  ENTERPRISE_CATEGORY.key,
  FINANCE_CATEGORY.key,
  HR_CATEGORY.key,
  DEVOPS_CATEGORY.key,
];

export const CATEGORY_LABELS: Record<
  EditorBlockDefinition["category"],
  string
> = {
  layout: "Estructura",
  content: "Contenido",
  action: "Acciones",
  [EC_CATEGORY.key]: EC_CATEGORY.label,
  [VERTICAL_CATEGORIES.analytics.key]: VERTICAL_CATEGORIES.analytics.label,
  [VERTICAL_CATEGORIES.crm.key]: VERTICAL_CATEGORIES.crm.label,
  [VERTICAL_CATEGORIES.productivity.key]: VERTICAL_CATEGORIES.productivity.label,
  [VERTICAL_CATEGORIES.marketing.key]: VERTICAL_CATEGORIES.marketing.label,
  [ENTERPRISE_CATEGORY.key]: ENTERPRISE_CATEGORY.label,
  [FINANCE_CATEGORY.key]: FINANCE_CATEGORY.label,
  [HR_CATEGORY.key]: HR_CATEGORY.label,
  [DEVOPS_CATEGORY.key]: DEVOPS_CATEGORY.label,
};
