"use client"
import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { testimonials } from "../data/index"

const productos = ["Todos", "Vida", "GMM", "Auto", "Hogar", "Empresarial", "GMM Colectivo"]

export default function SegurosTestimonios() {
  const [activeProduct, setActiveProduct] = useState("Todos")

  const filtered = activeProduct === "Todos"
    ? testimonials
    : testimonials.filter(t => t.product.includes(activeProduct))

  return (
    <div className="min-h-screen bg-[#06090f]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700/25 text-blue-400 text-xs mb-6">
            Clientes satisfechos
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">12,400 pólizas.</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">12,400 historias</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-blue-400 text-blue-400" />)}
            <span className="text-white/35 ml-2">4.9 / 5.0 · 640 reseñas verificadas</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "4.9", label: "Puntuación media" },
            { value: "640", label: "Reseñas verificadas" },
            { value: "98%", label: "Reclamaciones pagadas" },
            { value: "100%", label: "Recomendarían" },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-2xl border border-blue-800/20 bg-blue-950/10 text-center">
              <div className="text-2xl font-black text-blue-400 mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {productos.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setActiveProduct(p)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeProduct === p
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t.name + t.date} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />)}
                <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
              </div>
              <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-400">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/25">{t.handle}</div>
                  </div>
                </div>
                <span className="text-[10px] text-blue-700/60 border border-blue-900/30 px-2 py-0.5 rounded-full">{t.product}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#06090f] to-[#0a0e18]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Tu tranquilidad es nuestra prioridad</h2>
          <p className="text-white/35 mb-8">Únete a las 12,400 personas y empresas que confían en Fortuna. Cotización gratuita, sin compromiso.</p>
          <Link href="/webs/seguros/contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30 inline-block">
            Cotizar mi seguro
          </Link>
        </div>
      </section>
    </div>
  )
}
