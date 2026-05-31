"use client"
import { useState } from "react"
import Link from "next/link"
import { propiedades } from "../data/index"

const tipos = ["Todos", "Penthouse", "Departamento", "Casa", "Local Comercial", "Preventa"]

export default function InmobiliariaPropiedades() {
  const [filtro, setFiltro] = useState("Todos")
  const visibles = filtro === "Todos" ? propiedades : propiedades.filter(p => p.tipo === filtro)

  return (
    <div className="min-h-screen bg-[#0d0a04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-amber-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">Propiedades disponibles</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Catálogo de</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">propiedades</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Residencial, comercial y preventa. Todas verificadas jurídicamente antes de publicarse.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {tipos.map(t => (
            <button key={t} type="button" onClick={() => setFiltro(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filtro === t ? "bg-amber-600 text-white" : "border border-white/10 text-white/40 hover:text-white/70"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibles.map(p => (
            <div key={p.id} className={`p-6 rounded-2xl border ${p.border} ${p.bg} hover:scale-[1.01] transition-all flex flex-col`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bg} ${p.color} border ${p.border} mb-1 inline-block`}>{p.tag}</span>
                  <h3 className="font-bold text-white text-base leading-tight">{p.nombre}</h3>
                  <p className="text-xs text-white/35 mt-0.5">📍 {p.zona}</p>
                </div>
                <p className={`text-lg font-black ${p.color} shrink-0 text-right`}>{p.precio}</p>
              </div>
              <div className="flex gap-3 text-xs text-white/35 mb-3">
                <span>📐 {p.m2}</span>
                {p.recamaras > 0 && <span>🛏 {p.recamaras}</span>}
                <span>🚿 {p.banos}</span>
                <span>🚗 {p.parking}</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-5 flex-1">{p.desc}</p>
              <Link href="/webs/inmobiliaria/contacto" className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm ${p.color} border ${p.border} ${p.bg} hover:brightness-125 transition-all`}>
                Solicitar información →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#0a0702]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">¿No encontraste lo que buscas? Cuéntanos qué necesitas.</p>
          <Link href="/webs/inmobiliaria/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Búsqueda personalizada
          </Link>
        </div>
      </section>
    </div>
  )
}
