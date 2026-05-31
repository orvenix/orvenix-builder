"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
}

export const DEFAULT_NODE_ANIMATION: NodeAnimation = {
  type: "none",
  trigger: "load",
  duration: 560,
  delay: 0,
  easing: "smooth",
  hoverEffect: "none",
};

export interface MotionProps {
  motionAnimation?: MotionAnimation;
  motionTrigger?: MotionTrigger;
  motionTransition?: MotionTransition;
  motionDuration?: number;
  motionDelay?: number;
  motionEasing?: MotionEasing;
}

const MOTION_KEYS = new Set([
  "motionAnimation", "motionTrigger",
  "motionTransition", "motionDuration", "motionDelay", "motionEasing",
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

export function MotionWrapper({
  children,
  motionAnimation = "none",
  motionTrigger = "load",
  motionTransition = "none",
  motionDuration = 560,
  motionDelay = 0,
  motionEasing = "smooth",
}: MotionProps & { children: ReactNode }) {
  const hasAnimation = motionAnimation !== "none";
  const hasTransition = motionTransition !== "none";
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const duration = clampNumber(motionDuration, 120, 2400);
  const delay    = clampNumber(motionDelay, 0, 2000);
  const enterClass = hasAnimation ? `editor-motion-enter-${motionAnimation}` : "";

  // Handle non-load triggers
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasAnimation || motionTrigger === "load") return;

    // Remove the enter class that was applied on mount
    el.classList.remove(enterClass);

    if (motionTrigger === "scroll") {
      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add(enterClass);
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold: 0.15 }
      );
      observerRef.current.observe(el);
      return () => observerRef.current?.disconnect();
    }

    if (motionTrigger === "click") {
      const play = () => {
        el.classList.remove(enterClass);
        void el.offsetWidth; // force reflow
        el.classList.add(enterClass);
      };
      el.addEventListener("click", play);
      return () => el.removeEventListener("click", play);
    }

    if (motionTrigger === "hover") {
      const playIn  = () => { el.classList.remove(enterClass); void el.offsetWidth; el.classList.add(enterClass); };
      el.addEventListener("mouseenter", playIn);
      return () => el.removeEventListener("mouseenter", playIn);
    }
  }, [hasAnimation, motionTrigger, enterClass]);

  if (!hasAnimation && !hasTransition) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={cn(
        "editor-motion-frame",
        hasAnimation && motionTrigger === "load" && enterClass,
        hasTransition && `editor-motion-hover-${motionTransition}`,
        `editor-motion-ease-${motionEasing}`
      )}
      style={
        {
          "--editor-motion-duration": `${duration}ms`,
          "--editor-motion-delay": `${delay}ms`,
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

const KEYFRAME_MAP: Record<MotionAnimation, string> = {
  none: "",
  fade: `  from { opacity: 0; }\n  to   { opacity: 1; }`,
  "fade-up":    `  from { opacity: 0; transform: translateY(18px); filter: blur(5px); }\n  to   { opacity: 1; transform: translateY(0); filter: blur(0); }`,
  "fade-down":  `  from { opacity: 0; transform: translateY(-18px); filter: blur(5px); }\n  to   { opacity: 1; transform: translateY(0); filter: blur(0); }`,
  "slide-left": `  from { opacity: 0; transform: translateX(-22px); filter: blur(4px); }\n  to   { opacity: 1; transform: translateX(0); filter: blur(0); }`,
  "slide-right":`  from { opacity: 0; transform: translateX(22px); filter: blur(4px); }\n  to   { opacity: 1; transform: translateX(0); filter: blur(0); }`,
  scale:        `  from { opacity: 0; transform: scale(0.96); filter: blur(4px); }\n  to   { opacity: 1; transform: scale(1); filter: blur(0); }`,
};

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

  const keyframes = KEYFRAME_MAP[type];
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

  return (kfBlock + elementBlock + hoverBlock).trim() || "/* Sin animaciones configuradas */";
}
