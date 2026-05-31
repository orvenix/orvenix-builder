"use client"
import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { testimonials } from "../data/index"

const areas = ["Todos", "Laboral", "Mercantil", "Familiar", "Penal", "Inmobiliario", "Corporativo"]

export default function AbogadosTestimonios() {
  const [activeArea, setActiveArea] = useState("Todos")

  const filtered = activeArea === "Todos"
    ? testimonials
    : testimonials.filter(t => t.area === activeArea)

  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-amber-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            Testimonios verificados
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Lo que dicen</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">4,800 clientes</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-white/35 ml-2">4.9 / 5.0 · 380 reseñas verificadas</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "4.9", label: "Puntuación media", sub: "Sobre 5.0" },
            { value: "380", label: "Reseñas totales", sub: "Verificadas" },
            { value: "96%", label: "Recomendarían", sub: "El despacho" },
            { value: "92%", label: "Tasa de éxito", sub: "Global" },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-2xl border border-amber-800/20 bg-amber-950/10 text-center">
              <div className="text-2xl font-black text-amber-400 mb-1">{stat.value}</div>
              <div className="text-xs font-semibold text-white/50">{stat.label}</div>
              <div className="text-[10px] text-white/25">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {areas.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setActiveArea(a)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeArea === a
                  ? "bg-amber-700 text-white"
                  : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t.name + t.date} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
              </div>
              <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-400">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/25">{t.handle}</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-700/60 border border-amber-900/30 px-2 py-0.5 rounded-full">{t.area}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-[#070b14] to-[#0b1020]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Tu caso podría ser el siguiente</h2>
          <p className="text-white/35 mb-8">Únete a los 4,800 clientes que confiaron en nosotros. La primera consulta es gratuita.</p>
          <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Agendar consulta gratuita
          </Link>
        </div>
      </section>
    </div>
  )
}
