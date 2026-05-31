"use client";

import React from "react";
import { useEditorStore, GlobalTheme } from "./store/useEditorStore";
import { Palette, Type, ArrowLeft, RotateCcw, MoveHorizontal, Sparkles } from "lucide-react";

export const GlobalStylesPanel = ({ onClose }: { onClose: () => void }) => {
  const theme = useEditorStore((s) => s.tree.theme);
  const updateTheme = useEditorStore((s) => s.updateGlobalTheme);

  if (!theme) return null;

  const handleColorChange = (key: keyof GlobalTheme["colors"], value: string) => {
    updateTheme({
      colors: { ...theme.colors, [key]: value },
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#09101a] border-l border-white/5 w-72 animate-in slide-in-from-right duration-300">
      {/* Header del Panel */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-white">
          <Palette size={18} className="text-indigo-400" />
          <span className="text-sm font-bold tracking-tight">Estilos Globales</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
        {/* Sección de Colores */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Paleta de Marca</h3>
            <button className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <RotateCcw size={10} /> Reset
            </button>
          </div>
          
          <div className="grid gap-3">
            <ColorRow 
              label="Color Primario" 
              value={theme.colors.primary} 
              onChange={(v) => handleColorChange("primary", v)} 
            />
            <ColorRow 
              label="Color de Acento" 
              value={theme.colors.accent} 
              onChange={(v) => handleColorChange("accent", v)} 
            />
            <ColorRow 
              label="Fondo" 
              value={theme.colors.background} 
              onChange={(v) => handleColorChange("background", v)} 
            />
            <ColorRow 
              label="Texto" 
              value={theme.colors.text} 
              onChange={(v) => handleColorChange("text", v)} 
            />
          </div>
        </section>

        {/* Sección de Tipografía */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Type size={14} className="text-slate-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Tipografía</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Fuente Títulos</label>
              <select 
                value={theme.fontHeading}
                onChange={(e) => updateTheme({ fontHeading: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Inter, sans-serif">Inter (Moderno)</option>
                <option value="'Playfair Display', serif">Playfair (Elegante)</option>
                <option value="system-ui">Sistema</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Fuente Cuerpo</label>
              <select 
                value={theme.fontBody}
                onChange={(e) => updateTheme({ fontBody: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Inter, sans-serif">Inter (Moderno)</option>
                <option value="system-ui, sans-serif">Sistema</option>
                <option value="Georgia, serif">Georgia (Editorial)</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <MoveHorizontal size={14} className="text-slate-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Espaciado y Radios</h3>
          </div>

          <div className="space-y-4">
            <TokenInput
              label="Padding horizontal secciones"
              value={theme.spacing?.sectionX ?? "1.5rem"}
              onChange={(value) => updateTheme({ spacing: { ...theme.spacing, sectionX: value } })}
            />
            <TokenInput
              label="Padding vertical secciones"
              value={theme.spacing?.sectionY ?? "3rem"}
              onChange={(value) => updateTheme({ spacing: { ...theme.spacing, sectionY: value } })}
            />
            <TokenInput
              label="Espaciado de stack"
              value={theme.spacing?.stack ?? "1.5rem"}
              onChange={(value) => updateTheme({ spacing: { ...theme.spacing, stack: value } })}
            />
            <TokenInput
              label="Radio tarjetas"
              value={theme.radius?.card ?? "1rem"}
              onChange={(value) => updateTheme({ radius: { ...theme.radius, card: value } })}
            />
            <TokenInput
              label="Radio botones"
              value={theme.radius?.button ?? "999px"}
              onChange={(value) => updateTheme({ radius: { ...theme.radius, button: value } })}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-slate-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Sombra y Motion</h3>
          </div>

          <div className="space-y-4">
            <TokenInput
              label="Sombra suave"
              value={theme.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)"}
              onChange={(value) => updateTheme({ shadow: { ...theme.shadow, soft: value } })}
            />
            <TokenInput
              label="Sombra fuerte"
              value={theme.shadow?.strong ?? "0 24px 60px rgba(15,23,42,0.18)"}
              onChange={(value) => updateTheme({ shadow: { ...theme.shadow, strong: value } })}
            />
            <TokenInput
              label="Duración motion"
              value={theme.motion?.duration ?? "240ms"}
              onChange={(value) => updateTheme({ motion: { ...theme.motion, duration: value } })}
            />
            <TokenInput
              label="Curva easing"
              value={theme.motion?.easing ?? "cubic-bezier(0.22, 1, 0.36, 1)"}
              onChange={(value) => updateTheme({ motion: { ...theme.motion, easing: value } })}
            />
          </div>
        </section>
      </div>

      <div className="p-4 bg-indigo-500/5 border-t border-white/5">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Los cambios aquí afectan a todos los bloques que usen tokens de diseño.
        </p>
      </div>
    </div>
  );
};

const ColorRow = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
    <span className="text-[11px] text-slate-300 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase">{value}</span>
      <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-white/10 shadow-inner">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer bg-transparent border-none"
        />
      </div>
    </div>
  </div>
);

const TokenInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-medium text-slate-400">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition-all focus:border-indigo-500"
    />
  </div>
);
