"use client"

import { Monitor, Smartphone, Tablet } from "lucide-react"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import type { DeviceMode } from "@/types/editor"

/** VE-1: the three customer preview widths. Same tree, same structure -- only the presentation width changes. */
export const CLIENT_PREVIEW_DEVICES: Array<{ device: DeviceMode; label: string; Icon: typeof Monitor }> = [
  { device: "desktop", label: "Escritorio", Icon: Monitor },
  { device: "tablet", label: "Tableta", Icon: Tablet },
  { device: "mobile", label: "Celular", Icon: Smartphone },
]

export function ClientDeviceSwitcher() {
  const currentDevice = useEditorStore((state) => state.currentDevice)
  const setDevice = useEditorStore((state) => state.setDevice)

  return (
    <div role="group" aria-label="Vista por dispositivo" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
      {CLIENT_PREVIEW_DEVICES.map(({ device, label, Icon }) => (
        <button
          key={device}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={currentDevice === device}
          onClick={() => setDevice(device)}
          className={cn(
            "grid h-7 w-8 place-items-center rounded-lg transition",
            currentDevice === device ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
