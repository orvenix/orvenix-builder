"use client"
import { useState } from "react"
import Link from "next/link"
import { menu } from "../data/index"

export default function RestauranteMenu() {
  const [activeCategory, setActiveCategory] = useState(menu[0].category)
  const current = menu.find(m => m.category === activeCategory)!

  return (
    <div className="min-h-screen bg-[#120b04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-amber-900/8 rounded-full blur-[130px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6 italic">
            Cocina de temporada · Ingredientes locales
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            <span className="text-white">Nuestra</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent italic">carta</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Todos los precios incluyen IVA. Sujeto a disponibilidad de temporada.</p>
        </div>
      </section>

      {/* Category tabs */}
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
          {menu.map(m => (
            <button key={m.category} type="button" onClick={() => setActiveCategory(m.category)}
              className={`flex-1 shrink-0 py-2.5 text-xs font-semibold rounded-lg transition-all ${activeCategory === m.category ? "bg-amber-600 text-white" : "text-white/40 hover:text-white/70"}`}>
              {m.category}
            </button>
          ))}
        </div>
      </div>

      <section className="pb-28 max-w-4xl mx-auto px-6">
        <div className="space-y-4">
          {current.items.map(item => (
            <div key={item.name} className="flex items-start justify-between gap-6 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white italic">{item.name}</h3>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-600/20 text-amber-400 border border-amber-700/30">{item.badge}</span>
                  )}
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
              <span className="font-black text-amber-400 text-lg shrink-0">{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#120b04] to-[#0a0502]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6 italic">¿Listo para vivirlo en persona?</p>
          <Link href="/webs/restaurante/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Reservar mi mesa
          </Link>
          <p className="text-xs text-white/20 mt-4">Reservaciones con mínimo 48 hrs de anticipación recomendadas</p>
        </div>
      </section>
    </div>
  )
}
