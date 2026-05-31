"use client"
import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { testimonials } from "../data/index"

const servicios = ["Todos", "Gestión Patrimonial", "Retiro", "Fiscal", "Corporativo", "Inversiones", "Patrimonial"]

export default function FinanzasTestimonios() {
  const [activeService, setActiveService] = useState("Todos")

  const filtered = activeService === "Todos"
    ? testimonials
    : testimonials.filter(t => t.service.includes(activeService))

  return (
    <div className="min-h-screen bg-[#040f0a]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-700/25 text-emerald-400 text-xs mb-6">
            Historias de éxito
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">620 familias.</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Un objetivo común</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-emerald-400 text-emerald-400" />)}
            <span className="text-white/35 ml-2">4.9 / 5.0 · 420 reseñas verificadas</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "4.9", label: "Calificación media" },
            { value: "78%", label: "Clientes 5+ años" },
            { value: "18.4%", label: "Rendimiento promedio anual" },
            { value: "$3.2B", label: "MXN bajo asesoría" },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-2xl border border-emerald-800/20 bg-emerald-950/10 text-center">
              <div className="text-2xl font-black text-emerald-400 mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {servicios.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveService(s)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeService === s
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t.name + t.date} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />)}
                <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
              </div>
              <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-400">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/25">{t.handle}</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700/60 border border-emerald-900/30 px-2 py-0.5 rounded-full">{t.service}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#040f0a] to-[#070f09]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Tu historia de éxito comienza aquí</h2>
          <p className="text-white/35 mb-8">Únete a las 620 familias que confían en Nexo Capital. Diagnóstico inicial completamente gratuito.</p>
          <Link href="/webs/finanzas/contacto" className="px-8 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/30 inline-block">
            Agendar diagnóstico gratis
          </Link>
        </div>
      </section>
    </div>
  )
}
