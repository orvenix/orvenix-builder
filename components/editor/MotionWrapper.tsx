"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/builder-core/runtime/interaction";

// ─── Formal animation types ───────────────────────────────────────────────────

export type MotionAnimation =
  | "none"
  | "fade"
  | "fade-up"
  | "fade-down"
  | "slide-left"
  | "slide-right"
  | "scale";

export type MotionTransition = "none" | "soft" | "lift" | "scale" | "glow";
export type MotionEasing = "smooth" | "snappy" | "gentle";

/** When the animation fires. */
export type MotionTrigger = "load" | "scroll" | "click" | "hover";

/**
 * Formal animation contract for a node.
 * Stored in node.props as flat keys (motionAnimation, motionTrigger, etc.)
 * so existing data is fully backward-compatible.
 */
export interface NodeAnimation {
  type: MotionAnimation;
  trigger: MotionTrigger;
  duration: number;
  delay: number;
  easing: MotionEasing;
  hoverEffect: MotionTransition;
  distance: number;
  scale: number;
  blur: number;
}

export const DEFAULT_NODE_ANIMATION: NodeAnimation = {
  type: "none",
  trigger: "load",
  duration: 560,
  delay: 0,
  easing: "smooth",
  hoverEffect: "none",
  distance: 18,
  scale: 0.96,
  blur: 5,
};

export interface MotionProps {
  motionAnimation?: MotionAnimation;
  motionTrigger?: MotionTrigger;
  motionTransition?: MotionTransition;
  motionDuration?: number;
  motionDelay?: number;
  motionEasing?: MotionEasing;
  motionDistance?: number;
  motionScale?: number;
  motionBlur?: number;
  /** Renderer mode; never stored in node props (not in MOTION_KEYS). */
  runtimeMode?: "edit" | "preview";
}

const MOTION_KEYS = new Set([
  "motionAnimation", "motionTrigger",
  "motionTransition", "motionDuration", "motionDelay", "motionEasing",
  "motionDistance", "motionScale", "motionBlur",
]);

export function splitMotionProps<T extends Record<string, unknown>>(props: T) {
  const cleanProps: Record<string, unknown> = {};
  const motionProps: MotionProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (MOTION_KEYS.has(key)) {
      (motionProps as Record<string, unknown>)[key] = value;
    } else {
      cleanProps[key] = value;
    }
  }

  return { blockProps: cleanProps as T, motionProps };
}

// ─── MotionWrapper ────────────────────────────────────────────────────────────

/**
 * Renders AUTHOR-defined node motion (AnimationsPanel). Deliberately separate
 * from AI semantic site motion (data-motion on the render root, PCE-4A).
 *
 * Policy (PCE-4A):
 * - edit: the frame (and its hover transition) still renders so the canvas
 *   keeps the same DOM/layout as public, but entrance animations never replay
 *   while authoring. The stored motion props are untouched.
 * - preview/public: entrance plays. Blur is never rendered (motionBlur stays
 *   in data for compatibility only). No will-change is ever set.
 * - SSR/no-JS: content is visible. Non-load triggers never hide content on
 *   the server; scroll-triggered content that is ALREADY in view at mount is
 *   left alone (no visible -> hidden -> visible flash); only content still
 *   off-screen is held back until it scrolls in.
 * - prefers-reduced-motion: no entrance/replay at all (plus the CSS guard).
 */
export function MotionWrapper({
  children,
  motionAnimation = "none",
  motionTrigger = "load",
  motionTransition = "none",
  motionDuration = 560,
  motionDelay = 0,
  motionEasing = "smooth",
  motionDistance = 18,
  motionScale = 0.96,
  runtimeMode = "preview",
}: MotionProps & { children: ReactNode }) {
  const hasConfiguredAnimation = motionAnimation !== "none";
  const playsEntrance = hasConfiguredAnimation && runtimeMode !== "edit";
  const hasTransition = motionTransition !== "none";
  const ref = useRef<HTMLDivElement>(null);

  const duration = clampNumber(motionDuration, 120, 2400);
  const delay    = clampNumber(motionDelay, 0, 2000);
  const distance = clampNumber(motionDistance, 0, 120);
  const scale    = clampNumber(motionScale, 0.8, 1);
  const enterClass = playsEntrance ? `editor-motion-enter-${motionAnimation}` : "";

  // Handle non-load triggers
  useEffect(() => {
    const el = ref.current;
    if (!el || !playsEntrance || motionTrigger === "load") return;
    if (prefersReducedMotion(typeof window === "undefined" ? undefined : window)) return;

    if (motionTrigger === "scroll") {
      if (typeof IntersectionObserver === "undefined") return;
      let firstCallback = true;
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          if (firstCallback) {
            firstCallback = false;
            if (entry.isIntersecting) {
              // Already visible at mount: never hide what the reader sees.
              observer.disconnect();
              return;
            }
            el.classList.add("editor-motion-pending");
            return;
          }
          if (entry.isIntersecting) {
            el.classList.remove("editor-motion-pending");
            el.classList.add(enterClass);
            observer.disconnect();
          }
        },
        // Threshold 0 (any visible pixel): a ratio threshold can never be
        // reached by content taller than the viewport / ratio, which would
        // leave held-back content hidden forever.
        { threshold: 0 }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        el.classList.remove("editor-motion-pending");
      };
    }

    const replay = () => {
      el.classList.remove(enterClass);
      void el.offsetWidth; // force reflow
      el.classList.add(enterClass);
    };

    if (motionTrigger === "click") {
      el.addEventListener("click", replay);
      return () => el.removeEventListener("click", replay);
    }

    if (motionTrigger === "hover") {
      el.addEventListener("mouseenter", replay);
      return () => el.removeEventListener("mouseenter", replay);
    }
  }, [playsEntrance, motionTrigger, enterClass]);

  if (!hasConfiguredAnimation && !hasTransition) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={cn(
        "editor-motion-frame",
        playsEntrance && motionTrigger === "load" && enterClass,
        hasTransition && `editor-motion-hover-${motionTransition}`,
        `editor-motion-ease-${motionEasing}`
      )}
      style={
        {
          "--editor-motion-duration": `${duration}ms`,
          "--editor-motion-delay": `${delay}ms`,
          "--editor-motion-distance": `${distance}px`,
          "--editor-motion-scale": scale,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

function clampNumber(value: unknown, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

// ─── CSS export helpers ───────────────────────────────────────────────────────

function getKeyframeBlock(anim: Partial<NodeAnimation>) {
  const type = anim.type ?? "none";
  const distance = clampNumber(anim.distance ?? DEFAULT_NODE_ANIMATION.distance, 0, 120);
  const scale = clampNumber(anim.scale ?? DEFAULT_NODE_ANIMATION.scale, 0.8, 1);
  // PCE-4A: blur is never exported (filter animation is too expensive for
  // public runtime); anim.blur is accepted for compatibility and ignored.
  const clear = "opacity: 1; transform: translate(0, 0) scale(1);";

  if (type === "fade") return `  from { opacity: 0; }
  to   { opacity: 1; }`;
  if (type === "fade-up") return `  from { opacity: 0; transform: translateY(${distance}px); }
  to   { ${clear} }`;
  if (type === "fade-down") return `  from { opacity: 0; transform: translateY(-${distance}px); }
  to   { ${clear} }`;
  if (type === "slide-left") return `  from { opacity: 0; transform: translateX(-${distance}px); }
  to   { ${clear} }`;
  if (type === "slide-right") return `  from { opacity: 0; transform: translateX(${distance}px); }
  to   { ${clear} }`;
  if (type === "scale") return `  from { opacity: 0; transform: scale(${scale}); }
  to   { ${clear} }`;
  return "";
}

const EASING_MAP: Record<MotionEasing, string> = {
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  gentle: "cubic-bezier(0.16, 1, 0.3, 1)",
  snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
};

/** Generates a self-contained CSS snippet from a NodeAnimation config. */
export function exportAnimationCss(anim: Partial<NodeAnimation>): string {
  const type      = anim.type ?? "none";
  const duration  = clampNumber(anim.duration ?? 560, 120, 2400);
  const delay     = clampNumber(anim.delay ?? 0, 0, 2000);
  const easing    = EASING_MAP[anim.easing ?? "smooth"];
  const hover     = anim.hoverEffect ?? "none";

  const keyframes = getKeyframeBlock(anim);
  const kfBlock   = keyframes ? `@keyframes ${type} {\n${keyframes}\n}\n\n` : "";
  const animDecl  = type !== "none"
    ? `  animation: ${type} ${duration}ms ${easing} ${delay}ms both;\n`
    : "";

  const hoverLines: string[] = [];
  if (hover === "lift")  hoverLines.push("  transform: translateY(-6px);", "  box-shadow: 0 18px 42px rgba(17,37,64,0.18);");
  if (hover === "scale") hoverLines.push("  transform: scale(1.018);");
  if (hover === "glow")  hoverLines.push("  box-shadow: 0 0 0 1px rgba(0,181,246,0.16), 0 18px 46px rgba(0,181,246,0.14);");
  if (hover === "soft")  hoverLines.push("  opacity: 0.96; filter: saturate(1.08);");
  const hoverBlock = hoverLines.length
    ? `\n.element:hover {\n${hoverLines.join("\n")}\n}\n`
    : "";

  const elementBlock = animDecl
    ? `.element {\n${animDecl}}\n`
    : "";

  const reducedMotionBlock = animDecl || hoverLines.length
    ? `\n@media (prefers-reduced-motion: reduce) {\n  .element, .element:hover { animation: none; transform: none; }\n}\n`
    : "";

  return (kfBlock + elementBlock + hoverBlock + reducedMotionBlock).trim() || "/* Sin animaciones configuradas */";
}
