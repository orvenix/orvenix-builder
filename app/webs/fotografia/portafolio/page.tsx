"use client"
import { useState } from "react"
import Link from "next/link"
import { Camera } from "lucide-react"
import { portfolio } from "../data/index"

const cats = ["Todos", "Bodas", "Corporativo", "Quinceañeras", "Retratos", "Producto", "Video"]

export default function FotografiaPortafolio() {
  const [active, setActive] = useState("Todos")
  const visible = active === "Todos" ? portfolio : portfolio.filter(p => p.category === active)

  return (
    <div className="min-h-screen bg-[#080708]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-yellow-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-400 text-xs mb-6">Portafolio</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestro</span>{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">trabajo</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Una selección de proyectos recientes. Cada imagen tiene una historia detrás.</p>
        </div>
      </section>

      {/* Filtros */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {cats.map(cat => (
            <button key={cat} type="button" onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${active === cat ? "bg-yellow-500 text-black" : "border border-white/10 text-white/40 hover:text-white/70"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(item => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] aspect-[4/3] flex items-end hover:border-yellow-700/30 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/15 to-black/50" />
              <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-25 transition-opacity">
                <Camera className="w-20 h-20 text-yellow-400" />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/5 transition-colors" />
              <div className="relative p-5 w-full">
                <span className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-wider">{item.category}</span>
                <p className="text-base font-bold text-white mt-0.5 group-hover:text-yellow-200 transition-colors">{item.title}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.location} · {item.year}</p>
              </div>
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-20 text-white/25">
            <Camera size={40} className="mx-auto mb-4 opacity-30" />
            <p>Sin proyectos en esta categoría aún.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-[#080708] to-[#0b090a]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">¿Listo para tu sesión?</h2>
          <p className="text-white/35 mb-8">Cuéntanos tu proyecto y te contactamos con disponibilidad y propuesta en 24 horas.</p>
          <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30 inline-block">
            Reservar sesión
          </Link>
        </div>
      </section>
    </div>
  )
}
