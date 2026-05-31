"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, TrendingDown, Eye, Calendar, Globe, Loader2 } from "lucide-react"
import type { SiteAnalytics } from "@/lib/analytics"

interface Props {
  siteId: string
  siteName: string
}

export default function AnaliticasPage({ siteId, siteName }: Props) {
  const [data, setData] = useState<SiteAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/${siteId}`)
      .then(r => r.json())
      .then((d: SiteAnalytics) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [siteId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[color:var(--accent)]" size={32} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center text-[color:var(--text-secondary)]">
        <p>No se pudieron cargar las analíticas.</p>
      </div>
    )
  }

  const maxViews = Math.max(...data.daily.map(d => d.views), 1)
  const last7 = data.daily.slice(-7)
  const prev7 = data.daily.slice(-14, -7)
  const prev7Total = prev7.reduce((s, d) => s + d.views, 0)
  const trend = prev7Total === 0 ? null : ((data.last7Days - prev7Total) / prev7Total) * 100

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[color:var(--text)]">Analíticas</h1>
          <p className="mt-0.5 text-sm text-[color:var(--text-secondary)]">{siteName}</p>
        </div>
        <Link
          href={`/p/${siteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-3)]"
        >
          <Globe size={12} />
          Ver sitio publicado
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Hoy", value: data.todayViews, icon: Eye, color: "text-[color:var(--accent-2)]" },
          { label: "Últimos 7 días", value: data.last7Days, icon: Calendar, color: "text-[color:var(--accent)]" },
          { label: "Últimos 30 días", value: data.last30Days, icon: TrendingUp, color: "text-[color:var(--accent-3)]" },
          { label: "Total histórico", value: data.totalViews, icon: Globe, color: "text-amber-400" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <Icon size={16} className={`${stat.color} mb-3`} />
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value.toLocaleString("es-MX")}</p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Tendencia vs semana anterior */}
      {trend !== null && (
        <div className={`mb-6 flex items-center gap-2 text-sm font-semibold ${trend >= 0 ? "text-[color:var(--accent)]" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% vs la semana anterior
        </div>
      )}

      {/* Gráfico de barras — últimos 30 días */}
      <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] mb-6">
        <h2 className="font-bold text-white mb-6 text-sm">Visitas diarias — últimos 30 días</h2>

        {/* Chart */}
        <div className="flex items-end gap-1 h-32">
          {data.daily.map((day, i) => {
            const heightPct = maxViews > 0 ? (day.views / maxViews) * 100 : 0
            const isToday = i === data.daily.length - 1
            return (
              <div key={day.date} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t transition-all ${
                    isToday ? "bg-[color:var(--accent)]" : "bg-white/[0.12] group-hover:bg-[rgba(0,181,246,0.50)]"
                  }`}
                  style={{ height: `${Math.max(heightPct, day.views > 0 ? 3 : 0)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="rounded-lg border border-white/10 bg-[color:var(--bg)] px-2 py-1 text-[10px] whitespace-nowrap text-[color:var(--text)]">
                    <p className="font-bold">{day.views} visitas</p>
                    <p className="text-[color:var(--text-secondary)]">{formatDate(day.date)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Axis labels */}
        <div className="mt-2 flex justify-between text-[10px] text-[color:var(--text-muted)]">
          <span>{formatDate(data.daily[0]?.date ?? "")}</span>
          <span>{formatDate(data.daily[14]?.date ?? "")}</span>
          <span>Hoy</span>
        </div>
      </div>

      {/* Últimos 7 días en detalle */}
      <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <h2 className="font-bold text-white mb-4 text-sm">Últimos 7 días</h2>
        <div className="space-y-2">
          {last7.map((day, i) => {
            const isToday = i === last7.length - 1
            const barW = maxViews > 0 ? (day.views / maxViews) * 100 : 0
            return (
              <div key={day.date} className="flex items-center gap-4">
                <span className={`w-20 shrink-0 text-xs ${isToday ? "font-bold text-[color:var(--accent)]" : "text-[color:var(--text-secondary)]"}`}>
                  {isToday ? "Hoy" : formatDate(day.date)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isToday ? "bg-[color:var(--accent)]" : "bg-white/20"}`}
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <span className={`w-12 shrink-0 text-right text-xs font-bold ${isToday ? "text-[color:var(--accent)]" : "text-[color:var(--text-secondary)]"}`}>
                  {day.views.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {data.totalViews === 0 && (
        <div className="mt-6 rounded-2xl border border-amber-800/20 bg-amber-950/10 p-5 text-sm text-amber-300/70">
          Tu sitio aún no tiene visitas registradas. Las visitas se cuentan cada vez que alguien accede a
          {" "}<code className="text-[11px] font-mono text-amber-400/70">/p/{siteId}</code>.
        </div>
      )}
    </div>
  )
}
