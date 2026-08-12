import { MousePointer2 } from "lucide-react";
import { BLOCK_CANVAS_ITEMS, BLOCK_CANVAS_BROWSER_LABEL, BLOCK_CANVAS_PANEL_TITLE } from "@/lib/content";

const TONE_STYLES = {
  coral: { border: "rgba(255,106,77,0.35)", dot: "var(--coral)", bg: "var(--coral-tint)" },
  teal: { border: "rgba(28,159,143,0.35)", dot: "var(--teal)", bg: "var(--teal-tint)" },
  amber: { border: "rgba(246,169,59,0.4)", dot: "var(--amber)", bg: "var(--amber-tint)" },
};

export default function BlockCanvasMockup() {
  return (
    <div className="canvas-frame rounded-3xl p-3 sm:p-4 relative">
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full ml-2"
          style={{ background: "var(--paper-alt)", color: "var(--ink-muted)" }}
        >
          {BLOCK_CANVAS_BROWSER_LABEL}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3 space-y-2 relative">
          {BLOCK_CANVAS_ITEMS.map((block) => {
            const tone = TONE_STYLES[block.tone];
            return (
              <div
                key={block.id}
                className="canvas-block rounded-xl px-3 py-3.5 flex items-center justify-between"
                style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {block.label}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ background: tone.dot }} />
              </div>
            );
          })}

          <div className="canvas-cursor absolute" style={{ top: 8, left: "58%" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#ffffff", boxShadow: "var(--shadow-md)" }}
            >
              <MousePointer2 size={14} color="var(--coral)" />
            </div>
          </div>
        </div>

        <div className="col-span-1 rounded-xl p-2" style={{ background: "var(--paper-alt)" }}>
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wide mb-2 px-1">
            {BLOCK_CANVAS_PANEL_TITLE}
          </p>
          {BLOCK_CANVAS_ITEMS.map((layer) => (
            <div key={layer.id} className="layers-panel-row py-1.5 px-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink-faint)" }} />
              <span className="text-[10px] text-muted truncate">{layer.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
