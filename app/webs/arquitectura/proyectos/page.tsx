"use client"
import { useState } from "react"
import Link from "next/link"
import { projects, stats } from "../data/index"

const tipos = ["Todos", "Residencial", "Comercial", "Hospitalidad", "Remodelación", "Conjuntos", "Retail"]

export default function ArquitecturaProyectos() {
  const [filtro, setFiltro] = useState("Todos")
  const filtrados = filtro === "Todos" ? projects : projects.filter(p => p.type === filtro)

  return (
    <div className="bg-[#0a0908] min-h-screen">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-[700px] h-[400px] bg-amber-900/4 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-6">Portafolio</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Proyectos realizados</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto leading-relaxed mb-10">
            Más de 240 proyectos entregados en Ciudad de México, Guadalajara, Monterrey, Los Cabos y Cancún.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                <div className="text-xl font-black text-amber-400">{s.value}</div>
                <div className="text-[10px] text-white/25 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex flex-wrap gap-2">
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`px-4 py-2 text-sm rounded-xl border transition-all font-medium ${filtro === t ? "bg-amber-700 border-amber-600 text-white" : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* GRID PROYECTOS */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map(p => (
            <div key={p.id} className={`rounded-3xl bg-gradient-to-br ${p.gradient} border border-white/[0.07] overflow-hidden hover:scale-[1.01] transition-all group`}>
              <div className="h-44 relative flex items-end p-6">
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-white/70 border border-white/15">{p.type}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-600/30 text-amber-300 border border-amber-600/30">{p.tag}</span>
                </div>
                <div className="text-5xl font-black text-white/5 absolute bottom-2 right-4">0{p.id}</div>
              </div>
              <div className="p-6 bg-black/20 backdrop-blur-sm">
                <h3 className="font-black text-white text-lg mb-1">{p.name}</h3>
                <p className="text-xs text-white/40 mb-3">{p.location} · {p.year}</p>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{p.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-white/30">{p.area}</span>
                  <Link href="/webs/arquitectura/contacto" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                    Proyecto similar →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="text-center py-20 text-white/30">No hay proyectos en esta categoría aún.</div>
        )}
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#0a0908] to-[#0d0b09] text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Tienes un proyecto similar?</h2>
          <p className="text-white/35 mb-8">Cuéntanos tu idea y te mostramos casos análogos de nuestro portafolio durante la consulta.</p>
          <Link href="/webs/arquitectura/contacto" className="px-10 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all">
            Agendar consulta gratuita →
          </Link>
        </div>
      </section>
    </div>
  )
}
