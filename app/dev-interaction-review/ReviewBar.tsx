import Link from "next/link";
import { RUNTIME_MOTION_BUCKETS } from "@/lib/builder-core/runtime/motion";

/** PCE-4A: DEV-ONLY navigation bar for the interaction review routes. */
export function ReviewBar({
  bucket,
  current,
  artifactVariants,
  suffix = "",
  cartPresets = [],
  activeCartPreset,
}: {
  bucket: string;
  current: string;
  artifactVariants: Array<[string, string]>;
  suffix?: string;
  cartPresets?: string[];
  activeCartPreset?: string;
}) {
  const style = (active: boolean) => ({ color: active ? "#7dd3fc" : "#e2e8f0", textDecoration: active ? "underline" : "none" });
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 60, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: "8px 16px", background: "#0f172a", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12 }}>
      <strong>PCE-4A review</strong>
      {RUNTIME_MOTION_BUCKETS.map((value) => (
        <Link key={value} href={`/dev-interaction-review/${value}${suffix}`} style={style(value === bucket)}>{value}</Link>
      ))}
      <span>|</span>
      <Link href={`/dev-interaction-review/${bucket}`} style={style(current === "vocabulary")}>vocabulary</Link>
      {artifactVariants.map(([key, label]) => (
        <Link key={key} href={`/dev-interaction-review/${bucket}/${key}/home`} style={style(current === key)}>{label}</Link>
      ))}
      {artifactVariants.length === 0 ? <span>(PCE-3C artifact not found locally)</span> : null}
      {cartPresets.length > 0 ? <span>| cart:</span> : null}
      {cartPresets.map((preset) => (
        <Link key={preset} href={`/dev-interaction-review/${bucket}?cart=${preset}`} style={style(preset === activeCartPreset)}>{preset}</Link>
      ))}
      <span style={{ opacity: 0.7 }}>Tab / Shift+Tab / Enter / Escape · reduced motion: OS or DevTools · narrow: DevTools device mode</span>
    </div>
  );
}
