"use client";

import { useEffect, useRef, useState } from "react";
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

export function buildGuidedSectionTree(suggestion: GuidedSectionSuggestion): EditorTree {
  const template = GUIDED_SECTION_TEMPLATES[suggestion.template];
  const id = suggestion.id;
  const sectionId = `guided-${id}-section`;
  const headingId = `guided-${id}-heading`;
  const bodyId = `guided-${id}-body`;
  const itemIds = (template.items ?? []).map((_, index) => `guided-${id}-item-${index + 1}`);
  const buttonId = template.button ? `guided-${id}-button` : null;
  const align = template.align ?? "left";
  const sectionProps: NodeProps = {
    as: template.as ?? "section",
    maxWidth: id === "nav" || id === "footer" ? "xl" : "lg",
    paddingY: id === "nav" ? "sm" : id === "hero" || id === "cta" ? "xl" : "lg",
    paddingX: "md",
    align,
    background: id === "hero" || id === "cta" ? "#f8fafc" : "#ffffff",
    border: id === "nav" || id === "footer" ? "1px solid rgba(15, 23, 42, 0.08)" : undefined,
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
          text: template.heading,
          level: id === "hero" ? 1 : 2,
          size: id === "hero" ? "5xl" : id === "nav" || id === "footer" ? "2xl" : "3xl",
          weight: "bold",
          align,
          color: "#0f172a",
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
          content: template.body,
          size: id === "hero" ? "lg" : "md",
          color: "#475569",
          align,
          maxWidth: align === "center" ? "lg" : "md",
        },
        children: [],
        version: 1,
      },
      ...Object.fromEntries(
        (template.items ?? []).map((item, index) => [
          itemIds[index],
          {
            id: itemIds[index],
            type: "text",
            displayName: `Punto ${index + 1}`,
            props: {
              content: item,
              size: "md",
              color: "#334155",
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
                label: template.button,
                href: "#contacto",
                variant: "primary",
                size: id === "hero" || id === "cta" ? "lg" : "md",
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
  onInsertSuggestion: (suggestion: GuidedSectionSuggestion) => void;
}

export function GuidedBlankCanvas({ onInsertSuggestion }: GuidedBlankCanvasProps) {
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleInsert = (suggestion: GuidedSectionSuggestion) => {
    if (activatingId) return;
    setActivatingId(suggestion.id);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onInsertSuggestion(suggestion);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="absolute left-1/2 top-1/2 w-[260px] -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-lg border border-slate-200/80 bg-white/75 text-slate-500 shadow-sm backdrop-blur-xl">
          <Icons.Sparkles size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Empieza con una sección</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Elige un globo para insertar una base editable.</p>
      </div>

      {GUIDED_SECTION_SUGGESTIONS.map((suggestion, index) => {
        const Icon = Icons[suggestion.icon] as ComponentType<{ size?: number; className?: string }>;
        const isActive = activatingId === suggestion.id;
        const isOtherActive = activatingId !== null && !isActive;

        return (
          <div
            key={suggestion.id}
            className={cn(
              "pointer-events-auto absolute transition-all duration-200 ease-out",
              isActive ? "opacity-0" : "opacity-100",
              isOtherActive && "opacity-25"
            )}
            style={{
              left: `${suggestion.x}%`,
              top: `${suggestion.y}%`,
              transform: `translate(-50%, -50%) scale(${isActive ? 0.92 : 1})`,
              transitionDelay: `${Math.min(index * 12, 120)}ms`,
            }}
          >
            <button
              type="button"
              aria-label={`Insertar ${suggestion.label}`}
              disabled={activatingId !== null}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleInsert(suggestion);
              }}
              className={cn(
                "group flex min-h-[74px] w-[176px] flex-col justify-between rounded-lg border px-3 py-2 text-left shadow-xl backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-wait",
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
          </div>
        );
      })}
    </div>
  );
}
