import React from 'react';
import { MessageCircle } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

export function AgencyCta({ phoneNumber = "123456789" }) {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const accent = theme?.colors?.accent ?? "#22c55e";
  const text = theme?.colors?.text ?? "#ffffff";
  const strongShadow = theme?.shadow?.strong ?? "0 24px 60px rgba(15,23,42,0.18)";
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const buttonRadius = theme?.radius?.button ?? "999px";
  const motionDuration = theme?.motion?.duration ?? "240ms";

  return (
    <div className="px-4 py-12 sm:px-6 md:py-20">
      <div
        className="relative mx-auto max-w-4xl overflow-hidden p-6 text-center sm:p-10 md:p-12"
        style={{
          borderRadius: `calc(${cardRadius} * 1.4)`,
          background: `linear-gradient(140deg, ${primary}, ${accent})`,
          boxShadow: strongShadow,
          color: text,
        }}
      >
        <h2 className="relative z-10 mb-6 text-3xl font-black tracking-tight md:text-5xl">
          ¿Listo para construir el futuro de tu negocio?
        </h2>
        <p className="relative z-10 mx-auto mb-10 max-w-xl font-medium" style={{ color: `${text}cc` }}>
          Agenda una consultoría gratuita hoy mismo y hablemos de cómo podemos transformar tu visión en código de alto rendimiento.
        </p>
        <a 
          href={`https://wa.me/${phoneNumber}`}
          className="relative z-10 inline-flex max-w-full items-center justify-center gap-3 px-5 py-4 font-black text-white active:scale-95 sm:px-10 sm:py-5"
          style={{
            borderRadius: buttonRadius,
            background: "rgba(255,255,255,0.14)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
            transitionDuration: motionDuration,
            backdropFilter: "blur(14px)",
          }}
        >
          <MessageCircle className="h-6 w-6 shrink-0" />
          <span>Contactar por WhatsApp</span>
        </a>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 blur-[100px]" style={{ background: `${accent}55` }} />
      </div>
    </div>
  );
}

AgencyCta.defaults = { phoneNumber: "123456789" };
