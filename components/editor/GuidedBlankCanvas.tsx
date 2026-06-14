"use client";

import { useRef, useState } from "react";
import type { ComponentType } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

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

export type GuidedSectionSuggestion = {
  id: string;
  label: string;
  description: string;
  type: string;
  icon: keyof typeof Icons;
  x: number;
  y: number;
  tone: keyof typeof TONE_STYLES;
};

export const GUIDED_SECTION_SUGGESTIONS: GuidedSectionSuggestion[] = [
  { id: "hero", label: "Hero principal", description: "Apertura con propuesta y CTA", type: "landing-hero", icon: "PanelsTopLeft", x: 20, y: 18, tone: "cyan" },
  { id: "nav", label: "Navegación", description: "Menú superior del sitio", type: "siteNav", icon: "Navigation", x: 48, y: 13, tone: "slate" },
  { id: "trust", label: "Confianza", description: "Logos, sellos o indicadores", type: "modular-trust", icon: "BadgeCheck", x: 76, y: 18, tone: "teal" },
  { id: "features", label: "Características", description: "Beneficios clave en grilla", type: "landing-features", icon: "LayoutGrid", x: 13, y: 38, tone: "sky" },
  { id: "services", label: "Servicios", description: "Oferta comercial modular", type: "agency-services", icon: "BriefcaseBusiness", x: 34, y: 33, tone: "emerald" },
  { id: "capabilities", label: "Capacidades", description: "Módulos y ventajas del producto", type: "modular-capabilities", icon: "Zap", x: 64, y: 34, tone: "violet" },
  { id: "architecture", label: "Arquitectura", description: "Flujo técnico o integraciones", type: "modular-architecture", icon: "Network", x: 87, y: 39, tone: "slate" },
  { id: "stats", label: "Métricas", description: "Números de impacto rápidos", type: "ec-stats-bar", icon: "TrendingUp", x: 22, y: 58, tone: "amber" },
  { id: "products", label: "Productos", description: "Catálogo o vitrina comercial", type: "ec-product-grid", icon: "ShoppingBag", x: 47, y: 55, tone: "emerald" },
  { id: "process", label: "Proceso", description: "Pasos claros de trabajo", type: "modular-process", icon: "Workflow", x: 72, y: 57, tone: "sky" },
  { id: "testimonials", label: "Testimonios", description: "Prueba social de clientes", type: "landing-testimonials", icon: "MessageSquareQuote", x: 10, y: 79, tone: "rose" },
  { id: "pricing", label: "Precios", description: "Planes, paquetes o membresías", type: "landing-pricing-real", icon: "BadgeDollarSign", x: 32, y: 78, tone: "amber" },
  { id: "contact", label: "Formulario", description: "Captación de leads o solicitud", type: "modular-contact-form", icon: "MailPlus", x: 56, y: 78, tone: "cyan" },
  { id: "cta", label: "CTA final", description: "Cierre directo a conversión", type: "agency-cta", icon: "MousePointerClick", x: 78, y: 78, tone: "violet" },
  { id: "footer", label: "Footer", description: "Cierre con enlaces y marca", type: "landing-footer", icon: "Rows3", x: 91, y: 66, tone: "slate" },
];

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
