"use client";

import * as Icons from "lucide-react";
import {
  useEditorStore,
  type DeviceMode,
  DEVICE_WIDTHS,
} from "@/store/useEditorStore";
import { hasResponsiveDevicePatch } from "@/components/editor/responsive";

const DEVICES: ReadonlyArray<{
  mode: DeviceMode;
  label: string;
  bp: string;
  icon: keyof typeof Icons;
  shortcut: string;
}> = [
  { mode: "desktop", label: "Escritorio", bp: "xl",   icon: "Monitor",    shortcut: "1" },
  { mode: "lg",      label: "Laptop",     bp: "lg",   icon: "Laptop",     shortcut: "2" },
  { mode: "tablet",  label: "Tablet",     bp: "md",   icon: "Tablet",     shortcut: "3" },
  { mode: "sm",      label: "Móvil L",    bp: "sm",   icon: "TabletSmartphone", shortcut: "4" },
  { mode: "mobile",  label: "Móvil",      bp: "base", icon: "Smartphone", shortcut: "5" },
];

// Tailwind translate classes for 5-position indicator strip
const INDICATOR_TRANSLATE = [
  "translate-x-0",
  "translate-x-8",
  "translate-x-16",
  "translate-x-24",
  "translate-x-32",
] as const;

export function DeviceToggle() {
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const setDevice = useEditorStore((s) => s.setDevice);
  const copyDesktopLayoutToDevice = useEditorStore((s) => s.copyDesktopLayoutToDevice);
  const resetDeviceOverrides = useEditorStore((s) => s.resetDeviceOverrides);

  const hasCurrentOverrides = useEditorStore((s) => {
    if (s.currentDevice === "desktop") return false;
    const device = s.currentDevice;
    return Object.values(s.tree.nodes).some((node) =>
      hasResponsiveDevicePatch(node.props, device)
    );
  });

  const activeIndex = DEVICES.findIndex((d) => d.mode === currentDevice);
  const canCopyDesktop = currentDevice !== "desktop";
  const currentLabel = DEVICES.find((d) => d.mode === currentDevice)?.label ?? "";

  return (
    <div className="flex items-center gap-2.5">
      <div
        role="radiogroup"
        aria-label="Modo de vista"
        className="motion-glass relative flex items-center rounded-lg border border-white/8 bg-white/4 p-0.5"
      >
        <span
          aria-hidden
          className={`absolute top-0.5 bottom-0.5 w-8 rounded-md bg-white/10 shadow-inner transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${INDICATOR_TRANSLATE[activeIndex] ?? "translate-x-0"}`}
        />

        {DEVICES.map((d) => {
          const Icon = Icons[d.icon] as React.ComponentType<{ size?: number }>;
          const isActive = currentDevice === d.mode;
          return (
            <button
              key={d.mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              title={`${d.label} (${d.bp}) · ${d.shortcut}`}
              onClick={() => setDevice(d.mode)}
              className={`motion-button relative z-10 grid h-7 w-8 place-items-center rounded-md ${
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      <div className="hidden items-center gap-1 font-mono text-[11px] tabular-nums sm:flex">
        <span className="text-slate-400">{DEVICE_WIDTHS[currentDevice]}</span>
      </div>

      {canCopyDesktop && (
        <div className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={() => copyDesktopLayoutToDevice(currentDevice as Exclude<DeviceMode, "desktop">)}
            title={`Copiar layout Desktop a ${currentLabel}`}
            className="motion-button inline-flex h-7 items-center gap-1.5 rounded-lg border border-sky-400/15 bg-sky-400/8 px-2 text-[11px] font-medium text-sky-200 transition-all hover:border-sky-300/30 hover:bg-sky-400/14"
          >
            <Icons.Copy size={12} />
            <span>Copiar xl</span>
          </button>

          <button
            type="button"
            onClick={() => resetDeviceOverrides(currentDevice as Exclude<DeviceMode, "desktop">)}
            disabled={!hasCurrentOverrides}
            title={`Resetear ajustes de ${currentLabel}`}
            className="motion-button inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 text-[11px] font-medium text-slate-400 transition-all hover:border-amber-300/25 hover:bg-amber-400/10 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/[0.07] disabled:hover:bg-white/[0.03] disabled:hover:text-slate-400"
          >
            <Icons.RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
