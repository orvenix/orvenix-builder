import React from 'react';
import { Quote } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

export function AgencyTestimonials() {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const strongShadow = theme?.shadow?.strong ?? "0 24px 60px rgba(15,23,42,0.18)";
  const motionDuration = theme?.motion?.duration ?? "240ms";
  const testimonials = [
    { name: "Marcos Vignale", role: "CEO @ NexaCorp", content: "La arquitectura que desarrollaron para nuestro SaaS es simplemente impecable. El valor percibido de nuestra marca subió instantáneamente." },
    { name: "Lucía Fernández", role: "Founder @ Studio-D", content: "Buscábamos exclusividad y eso fue lo que obtuvimos. No es una web común, es una herramienta de ventas de alto nivel." }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-16 px-6" style={{ background: `${background}f2` }}>
      {testimonials.map((t, i) => (
        <div
          key={i}
          className="p-10 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          style={{
            borderRadius: `calc(${cardRadius} * 1.6)`,
            background,
            border: `1px solid ${primary}12`,
            boxShadow: strongShadow,
            transitionDuration: motionDuration,
          }}
        >
          <Quote className="w-12 h-12 absolute -top-2 -left-2 group-hover:scale-110 transition-transform" style={{ color: `${primary}1f` }} />
          <p className="text-lg font-medium mb-8 relative z-10 leading-relaxed" style={{ color: `${text}d0` }}>
            &ldquo;{t.content}&rdquo;
          </p>
          <div className="flex flex-col">
            <span className="font-black tracking-tight" style={{ color: text }}>{t.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: primary }}>{t.role}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

AgencyTestimonials.defaults = {};
