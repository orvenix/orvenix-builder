import React from 'react';
import { Layout, Rocket, ShieldCheck } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

const SERVICES = [
  { title: "Desarrollo SaaS", desc: "Plataformas robustas bajo demanda con arquitectura escalable.", icon: Rocket },
  { title: "Landing Pages Pro", desc: "Diseños optimizados para conversión de alto ticket.", icon: Layout },
  { title: "Mantenimiento Elite", desc: "Seguridad y optimización constante para tu ecosistema.", icon: ShieldCheck },
];

export function AgencyServices() {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const accent = theme?.colors?.accent ?? primary;
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const motionDuration = theme?.motion?.duration ?? "240ms";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10 px-4">
      {SERVICES.map((s, i) => (
        <div
          key={i}
          className="group p-8 transition-all duration-500"
          style={{
            borderRadius: cardRadius,
            background: `${background}ee`,
            border: `1px solid ${primary}14`,
            boxShadow: softShadow,
          }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform"
            style={{
              borderRadius: "1rem",
              background: `${accent}10`,
              transitionDuration: motionDuration,
            }}
          >
            <s.icon className="w-6 h-6" style={{ color: primary }} />
          </div>
          <h3 className="text-xl font-black mb-4 tracking-tight" style={{ color: text }}>{s.title}</h3>
          <p className="text-sm leading-relaxed font-medium" style={{ color: `${text}b0` }}>
            {s.desc}
          </p>
          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${primary}18` }}>
            <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
              Saber más →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

AgencyServices.defaults = {};
