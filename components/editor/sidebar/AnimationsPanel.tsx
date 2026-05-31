"use client";

import { useState, useCallback, useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import {
  type MotionAnimation, type MotionEasing, type MotionTransition, type MotionTrigger,
  exportAnimationCss, type NodeAnimation, DEFAULT_NODE_ANIMATION,
} from "@/components/editor/MotionWrapper";
import {
  Play, Copy, Check, Loader, MousePointer, Eye, Scroll, Zap,
  ArrowUpFromLine, ArrowDownToLine, ArrowLeftFromLine, ArrowRightFromLine,
  Maximize2, Flame, Wind,
} from "lucide-react";

// ─── Animation type cards ─────────────────────────────────────────────────────

const ANIMATION_OPTIONS: { value: MotionAnimation; label: string; icon: React.ComponentType<{size?:number;className?:string}> }[] = [
  { value: "none",        label: "Ninguna",  icon: Wind },
  { value: "fade",        label: "Fade",     icon: Flame },
  { value: "fade-up",     label: "Subir",    icon: ArrowUpFromLine },
  { value: "fade-down",   label: "Bajar",    icon: ArrowDownToLine },
  { value: "slide-left",  label: "Izquierda",icon: ArrowLeftFromLine },
  { value: "slide-right", label: "Derecha",  icon: ArrowRightFromLine },
  { value: "scale",       label: "Escala",   icon: Maximize2 },
];

const TRIGGER_OPTIONS: { value: MotionTrigger; label: string; icon: React.ComponentType<{size?:number;className?:string}> }[] = [
  { value: "load",   label: "Al cargar",  icon: Zap },
  { value: "scroll", label: "Al scroll",  icon: Scroll },
  { value: "click",  label: "Al clic",    icon: MousePointer },
  { value: "hover",  label: "Al hover",   icon: Eye },
];

const HOVER_OPTIONS: { value: MotionTransition; label: string }[] = [
  { value: "none",  label: "Ninguna" },
  { value: "soft",  label: "Suave" },
  { value: "lift",  label: "Elevar" },
  { value: "scale", label: "Escalar" },
  { value: "glow",  label: "Glow" },
];

const EASING_OPTIONS: { value: MotionEasing; label: string }[] = [
  { value: "smooth", label: "Suave" },
  { value: "gentle", label: "Gentil" },
  { value: "snappy", label: "Rápida" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function previewAnimation(nodeId: string, animClass: string) {
  const el = document.getElementById(`node-${nodeId}`)?.querySelector(".editor-motion-frame") as HTMLElement | null;
  if (!el) return;
  el.classList.remove(animClass);
  void el.offsetWidth;
  el.classList.add(animClass);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimationsPanel() {
  const selectedId    = useEditorStore((s) => s.selectedId);
  const node          = useEditorStore((s) => s.selectedId ? s.tree.nodes[s.selectedId] : null);
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);

  const [showCss, setShowCss]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const props = node ? resolveResponsiveProps(node.props, currentDevice) : null;

  const anim: NodeAnimation = useMemo(() => ({
    type:        (props?.motionAnimation as MotionAnimation)  ?? DEFAULT_NODE_ANIMATION.type,
    trigger:     (props?.motionTrigger   as MotionTrigger)    ?? DEFAULT_NODE_ANIMATION.trigger,
    duration:    typeof props?.motionDuration === "number"    ? props.motionDuration  : DEFAULT_NODE_ANIMATION.duration,
    delay:       typeof props?.motionDelay === "number"       ? props.motionDelay     : DEFAULT_NODE_ANIMATION.delay,
    easing:      (props?.motionEasing    as MotionEasing)     ?? DEFAULT_NODE_ANIMATION.easing,
    hoverEffect: (props?.motionTransition as MotionTransition) ?? DEFAULT_NODE_ANIMATION.hoverEffect,
  }), [props]);

  const update = useCallback((patch: Partial<Record<string, unknown>>) => {
    if (selectedId) updateNodeProps(selectedId, patch);
  }, [selectedId, updateNodeProps]);

  const handlePreview = useCallback(() => {
    if (!selectedId || anim.type === "none") return;
    setPreviewing(true);
    previewAnimation(selectedId, `editor-motion-enter-${anim.type}`);
    setTimeout(() => setPreviewing(false), anim.duration + anim.delay + 200);
  }, [selectedId, anim.type, anim.duration, anim.delay]);

  const handleCopyCss = useCallback(async () => {
    const css = exportAnimationCss(anim);
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [anim]);

  const cssExport = exportAnimationCss(anim);

  if (!node || !selectedId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 grid place-items-center">
          <Play size={18} className="text-violet-400/60" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Selecciona un bloque para configurar sus animaciones
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
        <div className="w-5 h-5 rounded bg-violet-500/15 grid place-items-center shrink-0">
          <Play size={10} className="text-violet-400" />
        </div>
        <span className="text-[11px] font-semibold text-slate-300 truncate">
          {node.displayName ?? node.type}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-3">

        {/* Animation type */}
        <section>
          <Label>Tipo de entrada</Label>
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {ANIMATION_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = anim.type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ motionAnimation: value })}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[9px] font-semibold transition-all ${
                    active
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                      : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:border-white/[0.14] hover:text-slate-300"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Trigger */}
        {anim.type !== "none" && (
          <section>
            <Label>Disparar cuando</Label>
            <div className="grid grid-cols-2 gap-1 mt-1.5">
              {TRIGGER_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = anim.trigger === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ motionTrigger: value })}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                      active
                        ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Timing */}
        {anim.type !== "none" && (
          <section>
            <Label>Duración · Retardo · Curva</Label>
            <div className="mt-1.5 space-y-2">
              <SliderRow
                label={`Duración: ${anim.duration}ms`}
                min={120} max={2400} step={40}
                value={anim.duration}
                onChange={(v) => update({ motionDuration: v })}
              />
              <SliderRow
                label={`Retardo: ${anim.delay}ms`}
                min={0} max={2000} step={40}
                value={anim.delay}
                onChange={(v) => update({ motionDelay: v })}
              />
              <div className="flex gap-1">
                {EASING_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ motionEasing: value })}
                    className={`flex-1 rounded-md py-1 text-[9px] font-semibold transition-colors ${
                      anim.easing === value
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Hover */}
        <section>
          <Label>Efecto hover</Label>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {HOVER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ motionTransition: value })}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  anim.hoverEffect === value
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        {anim.type !== "none" && (
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center justify-center gap-2 h-8 rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300 text-[11px] font-semibold transition-all hover:bg-violet-500/20 disabled:opacity-50"
          >
            {previewing ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
            {previewing ? "Reproduciendo…" : "▶ Previsualizar en canvas"}
          </button>
        )}

        {/* Keyframe viewer */}
        {anim.type !== "none" && (
          <section>
            <Label>Keyframes</Label>
            <div className="mt-1.5 rounded-xl border border-white/[0.07] bg-[#070d17] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05]">
                <span className="font-mono text-[9px] text-violet-400">@keyframes {anim.type}</span>
                <div className="flex gap-1">
                  <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[8px] text-violet-300 font-semibold">from</span>
                  <span className="rounded bg-slate-700/40 px-1.5 py-0.5 text-[8px] text-slate-400 font-semibold">to</span>
                </div>
              </div>
              <div className="flex">
                {/* Timeline bar */}
                <div className="flex flex-col justify-between py-3 px-2 border-r border-white/[0.05] min-w-8 items-center">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <div className="flex-1 w-px bg-white/10 my-1" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                {/* Keyframe values */}
                <div className="flex-1 py-2 px-3 font-mono text-[9px] space-y-3">
                  <KeyframePoint label="0%" isFrom />
                  <KeyframePoint label="100%" />
                </div>
              </div>
              <div className="px-3 pb-2">
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (anim.delay / (anim.duration + anim.delay || 1)) * 100)}%`, opacity: anim.delay > 0 ? 1 : 0 }}
                    />
                    <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full" />
                  </div>
                  <span className="text-[8px] text-slate-600 shrink-0">{anim.duration}ms</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Export CSS */}
        <section>
          <div className="flex items-center justify-between">
            <Label>Export CSS</Label>
            <button
              type="button"
              onClick={() => setShowCss((s) => !s)}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showCss ? "Ocultar" : "Ver CSS"}
            </button>
          </div>

          {showCss && (
            <div className="mt-1.5 rounded-xl border border-white/[0.07] bg-[#070d17] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05]">
                <span className="font-mono text-[9px] text-emerald-400">animation.css</span>
                <button
                  type="button"
                  onClick={handleCopyCss}
                  className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-200 transition-colors"
                >
                  {copied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre className="p-3 text-[9px] text-slate-400 font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-48 overflow-y-auto">
                {cssExport}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </span>
  );
}

function SliderRow({
  label, min, max, step, value, onChange,
}: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[9px] text-slate-500">{label}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full accent-violet-500"
      />
    </div>
  );
}

function KeyframePoint({ label, isFrom }: { label: string; isFrom?: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className={`shrink-0 text-[8px] font-semibold ${isFrom ? "text-violet-400" : "text-emerald-400"}`}>
        {label}
      </span>
      <span className="text-slate-500">
        {isFrom ? "{ opacity: 0; transform: … }" : "{ opacity: 1; transform: initial; }"}
      </span>
    </div>
  );
}
