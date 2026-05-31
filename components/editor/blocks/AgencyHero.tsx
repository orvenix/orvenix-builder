import React from 'react';
import { Sparkles } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

export function AgencyHero({ title = "Ecosistemas digitales de alto impacto", subtitle = "Diseñamos y desarrollamos productos digitales que escalan tu autoridad y facturación." }) {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const accent = theme?.colors?.accent ?? primary;
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const motionDuration = theme?.motion?.duration ?? "240ms";

  return (
    <section
      className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 md:pb-16 md:pt-20"
      style={{ background, color: text }}
    >
      <div className="max-w-5xl mx-auto text-center">
        <div
          className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
          style={{
            border: `1px solid ${primary}22`,
            background: `${primary}12`,
            color: primary,
          }}
        >
          <Sparkles className="h-3 w-3 shrink-0" style={{ color: accent }} />
          <span className="truncate">Agencia de Desarrollo Elite</span>
        </div>
        <h1 className="mb-8 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-7xl" style={{ color: text }}>
          {title}
          <span style={{ color: primary }}>.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base font-medium leading-relaxed sm:text-lg md:text-xl" style={{ color: `${text}b3` }}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            className="w-full px-8 py-4 font-bold text-white active:scale-95 sm:w-auto"
            style={{
              borderRadius: theme?.radius?.button ?? "999px",
              background: `linear-gradient(135deg, ${primary}, ${accent})`,
              boxShadow: softShadow,
              transitionDuration: motionDuration,
            }}
          >
            Iniciar Proyecto
          </button>
          <div
            className="flex max-w-full items-center gap-3 px-4 py-2"
            style={{
              borderRadius: cardRadius,
              border: `1px solid ${primary}18`,
              background: `${background}d9`,
              boxShadow: softShadow,
            }}
          >
            <div className="flex shrink-0 -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2" style={{ background: `${primary}22`, borderColor: background }} />)}
            </div>
            <span className="min-w-0 text-xs font-bold" style={{ color: `${text}99` }}>+50 clientes premium</span>
          </div>
        </div>
      </div>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10"
        style={{ background: `radial-gradient(circle at center, ${primary}14 0%, transparent 55%)` }}
      />
    </section>
  );
}

AgencyHero.defaults = {
  title: "Ecosistemas digitales de alto impacto",
  subtitle: "Diseñamos y desarrollamos productos digitales que escalan tu autoridad y facturación."
};
