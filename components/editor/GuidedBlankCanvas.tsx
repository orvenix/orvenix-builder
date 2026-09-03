"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ComponentType } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorTree, NodeProps } from "@/types/editor";

const TONE_STYLES = {
  cyan: "border-cyan-400/30 bg-cyan-50/70 text-cyan-950 shadow-cyan-950/[0.07]",
  sky: "border-sky-400/30 bg-sky-50/70 text-sky-950 shadow-sky-950/[0.07]",
  teal: "border-teal-400/30 bg-teal-50/70 text-teal-950 shadow-teal-950/[0.07]",
  emerald: "border-emerald-400/30 bg-emerald-50/70 text-emerald-950 shadow-emerald-950/[0.07]",
  amber: "border-amber-400/35 bg-amber-50/75 text-amber-950 shadow-amber-950/[0.07]",
  rose: "border-rose-400/30 bg-rose-50/70 text-rose-950 shadow-rose-950/[0.07]",
  violet: "border-violet-400/30 bg-violet-50/70 text-violet-950 shadow-violet-950/[0.07]",
  slate: "border-slate-300/70 bg-white/72 text-slate-900 shadow-slate-950/[0.08]",
} as const;

type GuidedTemplateId =
  | "hero"
  | "nav"
  | "trust"
  | "features"
  | "services"
  | "capabilities"
  | "architecture"
  | "stats"
  | "products"
  | "process"
  | "testimonials"
  | "pricing"
  | "contact"
  | "cta"
  | "footer";

export type GuidedSectionSuggestion = {
  id: GuidedTemplateId;
  label: string;
  description: string;
  template: GuidedTemplateId;
  icon: keyof typeof Icons;
  x: number;
  y: number;
  tone: keyof typeof TONE_STYLES;
};

export type GuidedSectionDraft = {
  heading: string;
  body: string;
  itemsText: string;
  button: string;
};

export const GUIDED_SECTION_SUGGESTIONS: GuidedSectionSuggestion[] = [
  { id: "hero", label: "Hero principal", description: "Apertura clara con propuesta y CTA", template: "hero", icon: "PanelsTopLeft", x: 20, y: 18, tone: "cyan" },
  { id: "nav", label: "Navegación", description: "Cabecera simple con enlaces base", template: "nav", icon: "Navigation", x: 48, y: 13, tone: "slate" },
  { id: "trust", label: "Confianza", description: "Sellos, garantías o datos clave", template: "trust", icon: "BadgeCheck", x: 76, y: 18, tone: "teal" },
  { id: "features", label: "Características", description: "Beneficios principales del sitio", template: "features", icon: "LayoutGrid", x: 13, y: 38, tone: "sky" },
  { id: "services", label: "Servicios", description: "Oferta organizada para vender", template: "services", icon: "BriefcaseBusiness", x: 34, y: 33, tone: "emerald" },
  { id: "capabilities", label: "Capacidades", description: "Qué puede hacer tu solución", template: "capabilities", icon: "Zap", x: 64, y: 34, tone: "violet" },
  { id: "architecture", label: "Cómo funciona", description: "Explica tu método o sistema", template: "architecture", icon: "Network", x: 87, y: 39, tone: "slate" },
  { id: "stats", label: "Métricas", description: "Números para reforzar confianza", template: "stats", icon: "TrendingUp", x: 22, y: 58, tone: "amber" },
  { id: "products", label: "Productos", description: "Muestra una vitrina sencilla", template: "products", icon: "ShoppingBag", x: 47, y: 55, tone: "emerald" },
  { id: "process", label: "Proceso", description: "Pasos simples de trabajo", template: "process", icon: "Workflow", x: 72, y: 57, tone: "sky" },
  { id: "testimonials", label: "Testimonios", description: "Opiniones y prueba social", template: "testimonials", icon: "MessageSquareQuote", x: 10, y: 79, tone: "rose" },
  { id: "pricing", label: "Precios", description: "Planes o paquetes comparables", template: "pricing", icon: "BadgeDollarSign", x: 32, y: 78, tone: "amber" },
  { id: "contact", label: "Contacto", description: "Invita a escribir o agendar", template: "contact", icon: "MailPlus", x: 56, y: 78, tone: "cyan" },
  { id: "cta", label: "CTA final", description: "Cierre directo a conversión", template: "cta", icon: "MousePointerClick", x: 78, y: 78, tone: "violet" },
  { id: "footer", label: "Footer", description: "Cierre con marca y enlaces", template: "footer", icon: "Rows3", x: 91, y: 66, tone: "slate" },
];

type GuidedTemplate = {
  heading: string;
  body: string;
  align?: "left" | "center";
  as?: "section" | "header" | "footer";
  button?: string;
  items?: string[];
};

type GuidedVisualRecipe = {
  family: string;
  section: NodeProps;
  headingSize: "2xl" | "3xl" | "4xl" | "5xl";
  headingWeight: "semibold" | "bold" | "extrabold";
  headingColor: string;
  bodyColor: string;
  itemColor: string;
  buttonVariant: "primary" | "secondary" | "ghost";
  buttonSize: "md" | "lg";
  bodyMaxWidth: "md" | "lg" | "none";
  itemPrefix?: string;
};

const GUIDED_VISUAL_RECIPES: Record<GuidedTemplateId, GuidedVisualRecipe> = {
  hero: {
    family: "Editorial claro",
    section: {
      as: "header",
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "lg",
      align: "left",
      mobileAlign: "center",
      background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 54%, #e0f2fe 100%)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
      borderRadius: "2xl",
      boxShadow: "0 26px 70px rgba(15, 23, 42, 0.10)",
    },
    headingSize: "5xl",
    headingWeight: "extrabold",
    headingColor: "#172554",
    bodyColor: "#475569",
    itemColor: "#334155",
    buttonVariant: "primary",
    buttonSize: "lg",
    bodyMaxWidth: "lg",
  },
  nav: {
    family: "Barra minimal",
    section: {
      as: "header",
      maxWidth: "xl",
      paddingY: "sm",
      paddingX: "lg",
      align: "center",
      background: "rgba(255, 255, 255, 0.86)",
      border: "1px solid rgba(15, 23, 42, 0.10)",
      borderRadius: "xl",
      backdropFilter: "blur(18px)",
    },
    headingSize: "2xl",
    headingWeight: "bold",
    headingColor: "#0f172a",
    bodyColor: "#64748b",
    itemColor: "#64748b",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "none",
  },
  trust: {
    family: "Confianza limpia",
    section: {
      maxWidth: "lg",
      paddingY: "lg",
      paddingX: "lg",
      align: "center",
      background: "#f0fdfa",
      border: "1px solid rgba(13, 148, 136, 0.18)",
      borderRadius: "xl",
    },
    headingSize: "3xl",
    headingWeight: "bold",
    headingColor: "#134e4a",
    bodyColor: "#0f766e",
    itemColor: "#115e59",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "lg",
    itemPrefix: "✓ ",
  },
  features: {
    family: "Producto limpio",
    section: {
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "md",
      align: "left",
      background: "#ffffff",
      border: "1px solid rgba(2, 132, 199, 0.14)",
      borderRadius: "lg",
    },
    headingSize: "4xl",
    headingWeight: "extrabold",
    headingColor: "#0f172a",
    bodyColor: "#475569",
    itemColor: "#075985",
    buttonVariant: "secondary",
    buttonSize: "md",
    bodyMaxWidth: "lg",
    itemPrefix: "• ",
  },
  services: {
    family: "Local premium",
    section: {
      maxWidth: "lg",
      paddingY: "lg",
      paddingX: "lg",
      align: "left",
      background: "#ecfdf5",
      border: "1px solid rgba(22, 163, 74, 0.20)",
      borderRadius: "md",
      boxShadow: "0 18px 50px rgba(22, 101, 52, 0.08)",
    },
    headingSize: "3xl",
    headingWeight: "bold",
    headingColor: "#14532d",
    bodyColor: "#166534",
    itemColor: "#15803d",
    buttonVariant: "primary",
    buttonSize: "md",
    bodyMaxWidth: "md",
    itemPrefix: "Servicio: ",
  },
  capabilities: {
    family: "Tecnico sobrio",
    section: {
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "lg",
      align: "left",
      background: "#111827",
      border: "1px solid rgba(255, 255, 255, 0.10)",
      borderRadius: "xl",
      boxShadow: "0 28px 80px rgba(17, 24, 39, 0.24)",
    },
    headingSize: "4xl",
    headingWeight: "extrabold",
    headingColor: "#ffffff",
    bodyColor: "#cbd5e1",
    itemColor: "#93c5fd",
    buttonVariant: "primary",
    buttonSize: "lg",
    bodyMaxWidth: "lg",
    itemPrefix: "→ ",
  },
  architecture: {
    family: "Proceso institucional",
    section: {
      maxWidth: "md",
      paddingY: "lg",
      paddingX: "lg",
      align: "left",
      background: "#f8fafc",
      border: "1px solid rgba(71, 85, 105, 0.18)",
      borderRadius: "none",
    },
    headingSize: "3xl",
    headingWeight: "semibold",
    headingColor: "#1e293b",
    bodyColor: "#475569",
    itemColor: "#334155",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "md",
    itemPrefix: "Paso ",
  },
  stats: {
    family: "Impacto numerico",
    section: {
      maxWidth: "xl",
      paddingY: "md",
      paddingX: "lg",
      align: "center",
      background: "#fffbeb",
      border: "1px solid rgba(217, 119, 6, 0.22)",
      borderRadius: "lg",
    },
    headingSize: "3xl",
    headingWeight: "extrabold",
    headingColor: "#78350f",
    bodyColor: "#92400e",
    itemColor: "#b45309",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "lg",
  },
  products: {
    family: "Vitrina comercial",
    section: {
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "md",
      align: "center",
      background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
      border: "1px solid rgba(20, 184, 166, 0.18)",
      borderRadius: "xl",
    },
    headingSize: "4xl",
    headingWeight: "bold",
    headingColor: "#064e3b",
    bodyColor: "#0f766e",
    itemColor: "#047857",
    buttonVariant: "primary",
    buttonSize: "md",
    bodyMaxWidth: "lg",
    itemPrefix: "Disponible: ",
  },
  process: {
    family: "Metodo guiado",
    section: {
      maxWidth: "lg",
      paddingY: "lg",
      paddingX: "lg",
      align: "left",
      background: "#eff6ff",
      border: "1px solid rgba(37, 99, 235, 0.16)",
      borderRadius: "lg",
    },
    headingSize: "3xl",
    headingWeight: "bold",
    headingColor: "#1e3a8a",
    bodyColor: "#1d4ed8",
    itemColor: "#1e40af",
    buttonVariant: "secondary",
    buttonSize: "md",
    bodyMaxWidth: "md",
  },
  testimonials: {
    family: "Editorial humano",
    section: {
      maxWidth: "md",
      paddingY: "xl",
      paddingX: "lg",
      align: "center",
      background: "#fff1f2",
      border: "1px solid rgba(225, 29, 72, 0.14)",
      borderRadius: "2xl",
      boxShadow: "0 22px 70px rgba(159, 18, 57, 0.08)",
    },
    headingSize: "3xl",
    headingWeight: "bold",
    headingColor: "#881337",
    bodyColor: "#9f1239",
    itemColor: "#be123c",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "lg",
    itemPrefix: "“",
  },
  pricing: {
    family: "Comparativo directo",
    section: {
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "lg",
      align: "left",
      background: "#fafaf9",
      border: "1px solid rgba(120, 113, 108, 0.18)",
      borderRadius: "md",
    },
    headingSize: "4xl",
    headingWeight: "extrabold",
    headingColor: "#292524",
    bodyColor: "#57534e",
    itemColor: "#92400e",
    buttonVariant: "primary",
    buttonSize: "lg",
    bodyMaxWidth: "lg",
    itemPrefix: "Plan ",
  },
  contact: {
    family: "Contacto cercano",
    section: {
      maxWidth: "lg",
      paddingY: "lg",
      paddingX: "lg",
      align: "center",
      background: "#ecfeff",
      border: "1px solid rgba(8, 145, 178, 0.18)",
      borderRadius: "xl",
    },
    headingSize: "3xl",
    headingWeight: "bold",
    headingColor: "#164e63",
    bodyColor: "#0e7490",
    itemColor: "#0891b2",
    buttonVariant: "primary",
    buttonSize: "lg",
    bodyMaxWidth: "lg",
  },
  cta: {
    family: "Cierre fuerte",
    section: {
      maxWidth: "xl",
      paddingY: "xl",
      paddingX: "lg",
      align: "center",
      background: "linear-gradient(135deg, #312e81 0%, #0f172a 100%)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      borderRadius: "2xl",
      boxShadow: "0 28px 80px rgba(49, 46, 129, 0.22)",
    },
    headingSize: "4xl",
    headingWeight: "extrabold",
    headingColor: "#ffffff",
    bodyColor: "#dbeafe",
    itemColor: "#bfdbfe",
    buttonVariant: "primary",
    buttonSize: "lg",
    bodyMaxWidth: "lg",
  },
  footer: {
    family: "Footer sobrio",
    section: {
      as: "footer",
      maxWidth: "xl",
      paddingY: "md",
      paddingX: "lg",
      align: "left",
      background: "#020617",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "none",
    },
    headingSize: "2xl",
    headingWeight: "bold",
    headingColor: "#f8fafc",
    bodyColor: "#94a3b8",
    itemColor: "#cbd5e1",
    buttonVariant: "ghost",
    buttonSize: "md",
    bodyMaxWidth: "lg",
  },
};

const GUIDED_SECTION_TEMPLATES: Record<GuidedTemplateId, GuidedTemplate> = {
  hero: {
    heading: "Título principal de tu sitio",
    body: "Describe en una frase qué haces, para quién es y por qué vale la pena continuar.",
    align: "center",
    as: "header",
    button: "Comenzar ahora",
  },
  nav: {
    heading: "Nombre de tu marca",
    body: "Inicio · Servicios · Precios · Contacto",
    as: "header",
  },
  trust: {
    heading: "Por qué pueden confiar en ti",
    body: "Resume certificaciones, garantías, experiencia o señales de credibilidad que reduzcan dudas.",
    items: ["Años de experiencia", "Clientes atendidos", "Garantía o soporte"],
  },
  features: {
    heading: "Características principales",
    body: "Presenta tres beneficios concretos que expliquen el valor de tu producto o servicio.",
    items: ["Beneficio claro", "Implementación sencilla", "Resultado medible"],
  },
  services: {
    heading: "Servicios destacados",
    body: "Organiza tu oferta para que el visitante entienda rápidamente qué puede contratar.",
    items: ["Servicio principal", "Servicio complementario", "Acompañamiento"],
  },
  capabilities: {
    heading: "Qué puede hacer tu solución",
    body: "Explica capacidades, módulos o entregables sin usar lenguaje demasiado técnico.",
    items: ["Automatiza tareas", "Centraliza información", "Mejora el seguimiento"],
  },
  architecture: {
    heading: "Cómo funciona",
    body: "Muestra el método, proceso interno o sistema de trabajo que hace confiable tu propuesta.",
    items: ["Diagnóstico", "Implementación", "Optimización"],
  },
  stats: {
    heading: "Resultados en números",
    body: "Agrega métricas simples que respalden tu promesa y ayuden a comparar tu valor.",
    items: ["+120 proyectos", "98% satisfacción", "24h respuesta"],
  },
  products: {
    heading: "Productos o paquetes",
    body: "Crea una vitrina inicial para mostrar opciones, categorías o soluciones disponibles.",
    items: ["Producto destacado", "Paquete recomendado", "Solución personalizada"],
  },
  process: {
    heading: "Proceso de trabajo",
    body: "Explica qué sucede desde el primer contacto hasta la entrega final.",
    items: ["1. Consulta", "2. Propuesta", "3. Entrega"],
  },
  testimonials: {
    heading: "Lo que dicen tus clientes",
    body: "Incluye opiniones breves que transmitan confianza y resultados reales.",
    items: ["Cliente satisfecho", "Resultado logrado", "Experiencia de servicio"],
  },
  pricing: {
    heading: "Planes y precios",
    body: "Presenta opciones simples para que el visitante sepa cuál es el siguiente paso.",
    items: ["Básico", "Profesional", "A medida"],
  },
  contact: {
    heading: "Hablemos de tu proyecto",
    body: "Invita al usuario a dejar sus datos, escribir por WhatsApp o agendar una llamada.",
    button: "Solicitar información",
  },
  cta: {
    heading: "Listo para dar el siguiente paso",
    body: "Cierra la página con una invitación directa, concreta y fácil de entender.",
    align: "center",
    button: "Quiero empezar",
  },
  footer: {
    heading: "Tu marca",
    body: "Agrega enlaces importantes, datos de contacto y una frase breve de cierre.",
    as: "footer",
    items: ["Privacidad", "Términos", "Contacto"],
  },
};

function createGuidedSectionDraft(suggestion: GuidedSectionSuggestion): GuidedSectionDraft {
  const template = GUIDED_SECTION_TEMPLATES[suggestion.template];
  return {
    heading: template.heading,
    body: template.body,
    itemsText: (template.items ?? []).join("\n"),
    button: template.button ?? "",
  };
}

export function buildGuidedSectionTree(
  suggestion: GuidedSectionSuggestion,
  draft = createGuidedSectionDraft(suggestion)
): EditorTree {
  const template = GUIDED_SECTION_TEMPLATES[suggestion.template];
  const recipe = GUIDED_VISUAL_RECIPES[suggestion.template];
  const id = suggestion.id;
  const sectionId = `guided-${id}-section`;
  const headingId = `guided-${id}-heading`;
  const bodyId = `guided-${id}-body`;
  const items = draft.itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const itemIds = items.map((_, index) => `guided-${id}-item-${index + 1}`);
  const buttonLabel = draft.button.trim();
  const buttonId = buttonLabel ? `guided-${id}-button` : null;
  const align = (recipe.section.align as "left" | "center" | undefined) ?? template.align ?? "left";
  const sectionProps: NodeProps = {
    ...recipe.section,
    as: recipe.section.as ?? template.as ?? "section",
    align,
  };

  return {
    rootId: sectionId,
    nodes: {
      [sectionId]: {
        id: sectionId,
        type: "section",
        displayName: suggestion.label,
        props: sectionProps,
        children: [headingId, bodyId, ...itemIds, ...(buttonId ? [buttonId] : [])],
        version: 1,
      },
      [headingId]: {
        id: headingId,
        type: "heading",
        displayName: `Título - ${suggestion.label}`,
        props: {
          text: draft.heading.trim() || template.heading,
          level: id === "hero" ? 1 : 2,
          size: recipe.headingSize,
          weight: recipe.headingWeight,
          align,
          color: recipe.headingColor,
          marginBottom: "md",
        },
        children: [],
        version: 1,
      },
      [bodyId]: {
        id: bodyId,
        type: "text",
        displayName: `Texto - ${suggestion.label}`,
        props: {
          content: draft.body.trim() || template.body,
          size: id === "hero" || id === "cta" ? "lg" : "md",
          color: recipe.bodyColor,
          align,
          maxWidth: recipe.bodyMaxWidth,
        },
        children: [],
        version: 1,
      },
      ...Object.fromEntries(
        items.map((item, index) => [
          itemIds[index],
          {
            id: itemIds[index],
            type: "text",
            displayName: `Punto ${index + 1}`,
            props: {
              content: `${recipe.itemPrefix ?? ""}${item}`,
              size: "md",
              color: recipe.itemColor,
              align,
              maxWidth: "md",
            },
            children: [],
            version: 1,
          },
        ])
      ),
      ...(buttonId
        ? {
            [buttonId]: {
              id: buttonId,
              type: "ctaButton",
              displayName: `Botón - ${suggestion.label}`,
              props: {
                label: buttonLabel,
                href: "#contacto",
                variant: recipe.buttonVariant,
                size: recipe.buttonSize,
              },
              children: [],
              version: 1,
            },
          }
        : {}),
    },
  };
}

interface GuidedBlankCanvasProps {
  compact?: boolean;
  onInsertSuggestion: (suggestion: GuidedSectionSuggestion, draft: GuidedSectionDraft) => void;
}

export function GuidedBlankCanvas({ compact = false, onInsertSuggestion }: GuidedBlankCanvasProps) {
  const [activeSuggestion, setActiveSuggestion] = useState<GuidedSectionSuggestion | null>(null);
  const [draft, setDraft] = useState<GuidedSectionDraft | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const openEditor = (suggestion: GuidedSectionSuggestion) => {
    if (activatingId) return;
    setActiveSuggestion(suggestion);
    setDraft(createGuidedSectionDraft(suggestion));
  };

  const closeEditor = () => {
    if (activatingId) return;
    setActiveSuggestion(null);
    setDraft(null);
  };

  const updateDraft = (patch: Partial<GuidedSectionDraft>) => {
    setDraft((current) => current ? { ...current, ...patch } : current);
  };

  const handleInsert = () => {
    if (!activeSuggestion || !draft || activatingId) return;
    setActivatingId(activeSuggestion.id);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onInsertSuggestion(activeSuggestion, draft);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const suggestionEditor = activeSuggestion && draft && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[2300] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]">
          <div
            className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{activeSuggestion.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {activeSuggestion.description} · {GUIDED_VISUAL_RECIPES[activeSuggestion.template].family}
                </p>
              </div>
              <button
                type="button"
                title="Cerrar"
                onClick={closeEditor}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Icons.X size={15} />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Título
                <input
                  value={draft.heading}
                  onChange={(event) => updateDraft({ heading: event.target.value })}
                  className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Texto
                <textarea
                  value={draft.body}
                  onChange={(event) => updateDraft({ body: event.target.value })}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm normal-case leading-5 tracking-normal text-slate-700 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Puntos
                <textarea
                  value={draft.itemsText}
                  onChange={(event) => updateDraft({ itemsText: event.target.value })}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm normal-case leading-5 tracking-normal text-slate-700 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Botón
                <input
                  value={draft.button}
                  onChange={(event) => updateDraft({ button: event.target.value })}
                  className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm normal-case tracking-normal text-slate-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200/70 px-4 py-3">
              <button
                type="button"
                onClick={closeEditor}
                className="h-9 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsert}
                disabled={activatingId !== null}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {activatingId ? <Icons.Loader2 size={13} className="animate-spin" /> : <Icons.Plus size={13} />}
                Insertar sección
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null;

  const renderSuggestionButton = (suggestion: GuidedSectionSuggestion, options: { compactButton?: boolean } = {}) => {
    const Icon = Icons[suggestion.icon] as ComponentType<{ size?: number; className?: string }>;
    const isActive = activatingId === suggestion.id;
    const isEditing = activeSuggestion?.id === suggestion.id;
    const isOtherActive = (activatingId !== null && !isActive) || (activeSuggestion !== null && !isEditing);

    return (
      <button
        type="button"
        aria-label={"Insertar " + suggestion.label}
        disabled={activatingId !== null}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          openEditor(suggestion);
        }}
        className={cn(
          "group relative flex min-h-[74px] flex-col justify-between rounded-lg border px-3 py-2 text-left shadow-xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-wait",
          options.compactButton ? "w-full" : "w-[176px]",
          isActive ? "scale-95 opacity-0" : "opacity-100",
          isOtherActive && "opacity-25",
          TONE_STYLES[suggestion.tone]
        )}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-current/10 bg-white/45">
            <Icon size={14} className="opacity-75" />
          </span>
          <span className="min-w-0 text-[12px] font-semibold leading-4">{suggestion.label}</span>
        </span>
        <span className="mt-2 line-clamp-2 text-[10px] leading-4 opacity-70">{suggestion.description}</span>
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-md border border-current/10 bg-white/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Icons.Plus size={11} />
        </span>
      </button>
    );
  };

  if (compact) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40 overflow-auto px-4 py-6">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="pointer-events-auto relative mx-auto w-full max-w-[320px] rounded-xl border border-slate-200/80 bg-white/78 p-3 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-3 flex items-start gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white/80 text-slate-500">
              <Icons.Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Empieza con una sección</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Edita una sugerencia antes de insertarla en el lienzo.</p>
            </div>
          </div>
          <div className="grid gap-2">
            {GUIDED_SECTION_SUGGESTIONS.map((suggestion) => (
              <div key={suggestion.id}>{renderSuggestionButton(suggestion, { compactButton: true })}</div>
            ))}
          </div>
        </div>
        {suggestionEditor}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute left-1/2 top-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-lg border border-slate-200/80 bg-white/75 text-slate-500 shadow-sm backdrop-blur-xl">
          <Icons.Sparkles size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Empieza con una sección</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">15 sugerencias listas: elige una, edítala y conviértela en bloque.</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Base editable
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Diseño neutral
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Inserción rápida
        </div>
      </div>

      {GUIDED_SECTION_SUGGESTIONS.map((suggestion, index) => (
        <div
          key={suggestion.id}
          className="pointer-events-auto absolute transition-transform duration-200 ease-out"
          style={{
            left: suggestion.x + "%",
            top: suggestion.y + "%",
            transform: "translate(-50%, -50%)",
            transitionDelay: Math.min(index * 12, 120) + "ms",
          }}
        >
          {renderSuggestionButton(suggestion)}
        </div>
      ))}

      {suggestionEditor}
    </div>
  );
}
