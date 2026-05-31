import React from 'react';
import { Check } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

export function SaasPricing({ highlightPopular = true, currency = "usd" }) {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const secondary = theme?.colors?.secondary ?? "#0f172a";
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const accent = theme?.colors?.accent ?? primary;
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const buttonRadius = theme?.radius?.button ?? "999px";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const strongShadow = theme?.shadow?.strong ?? "0 24px 60px rgba(15,23,42,0.18)";
  const motionDuration = theme?.motion?.duration ?? "240ms";

  const plans = [
    { name: "Starter", price: "29", features: ["3 Proyectos", "Analytics Básico", "Soporte Mail"], popular: false },
    { name: "Professional", price: "99", features: ["Ilimitado", "AI Engine", "Soporte 24/7", "Custom Domain"], popular: true },
    { name: "Enterprise", price: "Custom", features: ["SLA Garantizado", "On-premise", "Dedicated Manager"], popular: false },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 p-2 sm:p-4 md:grid-cols-3 md:gap-8">
      {plans.map((plan, i) => (
        <div
          key={i}
          className={`relative flex min-w-0 flex-col p-6 transition-all duration-500 sm:p-8 ${plan.popular && highlightPopular ? "md:scale-105 z-10" : ""}`}
          style={{
            borderRadius: `calc(${cardRadius} * 1.2)`,
            background: plan.popular && highlightPopular ? secondary : background,
            color: plan.popular && highlightPopular ? "#ffffff" : text,
            border: plan.popular && highlightPopular ? undefined : `1px solid ${primary}1f`,
            boxShadow: plan.popular && highlightPopular ? strongShadow : softShadow,
            transitionDuration: motionDuration,
          }}
        >
          {plan.popular && highlightPopular && (
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 shadow-lg"
              style={{
                borderRadius: buttonRadius,
                background: `linear-gradient(135deg, ${primary}, ${accent})`,
              }}
            >
              MOST POPULAR
            </div>
          )}
          <p
            className="text-sm font-black uppercase tracking-[0.2em] mb-4"
            style={{ color: plan.popular && highlightPopular ? `${accent}` : `${text}99` }}
          >
            {plan.name}
          </p>
          <div className="mb-8 flex min-w-0 flex-wrap items-baseline gap-1">
            <span className="text-3xl font-black tracking-tighter sm:text-4xl">
              {plan.price !== "Custom" ? (currency === "usd" ? "$" : "€") : ""}{plan.price}
            </span>
            {plan.price !== "Custom" && <span className="text-sm font-bold opacity-60">/mes</span>}
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            {plan.features.map((f, j) => (
              <li key={j} className="flex min-w-0 items-center gap-3 text-sm font-medium">
                <div
                  className="shrink-0 rounded-full p-1"
                  style={{
                    background: plan.popular && highlightPopular ? `${accent}22` : `${primary}12`,
                    color: plan.popular && highlightPopular ? accent : primary,
                  }}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={4} />
                </div>
                <span style={{ color: plan.popular && highlightPopular ? "rgba(255,255,255,0.78)" : `${text}bf` }}>{f}</span>
              </li>
            ))}
          </ul>
          <button
            className="w-full py-4 font-black text-sm transition-all active:scale-95"
            style={{
              borderRadius: buttonRadius,
              background: plan.popular && highlightPopular ? "#ffffff" : secondary,
              color: plan.popular && highlightPopular ? secondary : "#ffffff",
            }}
          >
            Elegir {plan.name}
          </button>
        </div>
      ))}
    </div>
  );
}

SaasPricing.defaults = { highlightPopular: true, currency: "usd" };
