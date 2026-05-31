"use client"

import { useState } from "react"
import { revenuePoints, trafficSources, revenueStats } from "../data/charts"
import { colorHex, colorStyles } from "@/app/webs/_shared/lib/colors"

const RANGES = ["7D", "1M", "3M", "6M", "1A"] as const
type Range = (typeof RANGES)[number]

const W = 600
const H = 160
const PAD = 10

export function RevenueChart() {
  const [range, setRange] = useState<Range>("1A")

  const vals = revenuePoints.map((p) => p.value)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const span = max - min || 1

  const pts = revenuePoints.map((p, i) => ({
    x: (i / (revenuePoints.length - 1)) * W,
    y: PAD + (1 - (p.value - min) / span) * (H - PAD),
    label: p.month,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H} L 0,${H} Z`
  const accentHex = colorHex.violet

  return (
    <div className="motion-card motion-glass p-5 rounded-2xl bg-white/3 border border-white/7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
          <p className="text-xs text-white/35 mt-0.5">Ingresos acumulados del período</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/4 border border-white/6">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`motion-button px-2.5 py-1 rounded-md text-xs font-medium ${
                range === r ? "bg-violet-600/40 text-violet-300" : "text-white/30 hover:text-white/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 h-40 flex flex-col justify-between text-[10px] text-white/20 pr-2 pointer-events-none">
          <span>$120K</span>
          <span>$80K</span>
          <span>$40K</span>
        </div>

        <div className="ml-10">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" height={H}>
            <defs>
              <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={accentHex} stopOpacity="0.35" />
                <stop offset="100%" stopColor={accentHex} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="rev-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            {[0, 0.33, 0.66, 1].map((t, i) => (
              <line
                key={i}
                x1={0} y1={PAD + t * (H - PAD)}
                x2={W} y2={PAD + t * (H - PAD)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            ))}

            <path d={areaPath} fill="url(#rev-area)" />
            <path d={linePath} fill="none" stroke="url(#rev-line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#c084fc" />
            ))}
          </svg>

          <div className="flex justify-between mt-2">
            {revenuePoints.map((p) => (
              <span key={p.month} className="text-[10px] text-white/20">{p.month}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/6">
        {revenueStats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-white/30 mb-1">{s.label}</div>
            <div className="text-sm font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-emerald-400 font-medium">{s.delta} vs anterior</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrafficChart() {
  return (
    <div className="motion-card motion-glass p-5 rounded-2xl bg-white/3 border border-white/7">
      <h3 className="text-sm font-semibold text-white mb-1">Fuentes de Tráfico</h3>
      <p className="text-xs text-white/35 mb-5">Distribución del período</p>

      <div className="space-y-4">
        {trafficSources.map((src) => {
          const c = colorStyles[src.colorKey]
          return (
            <div key={src.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-white/50">{src.label}</span>
                <span className="text-xs font-semibold text-white/80">{src.value}%</span>
              </div>
              {/* SVG rect `width` is a presentation attribute — no CSS inline style */}
              <svg width="100%" height={6} className="rounded-full overflow-hidden" role="img" aria-label={`${src.label}: ${src.value}%`}>
                <rect width="100%" height="100%" fill="rgba(255,255,255,0.06)" rx="3" />
                <rect width={`${src.value}%`} height="100%" className={c.bgSolid} rx="3" />
              </svg>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/6">
        <div className="text-xs text-white/30 mb-1">Sesiones totales</div>
        <div className="text-2xl font-bold text-white">284,920</div>
        <div className="text-xs text-emerald-400 font-medium mt-0.5">+22.4% vs mes anterior</div>
      </div>
    </div>
  )
}
