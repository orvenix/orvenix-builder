"use client"
import { useState } from "react"
import Link from "next/link"
import { blogPosts } from "../data/index"

const cats = ["Todos", "Mercado", "Financiamiento", "Inversión", "Venta"]

export default function InmobiliariaBlog() {
  const [active, setActive] = useState("Todos")
  const filtered = active === "Todos" ? blogPosts : blogPosts.filter(p => p.category === active)

  return (
    <div className="min-h-screen bg-[#0d0a04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-amber-900/6 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">Análisis de mercado</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Blog</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">inmobiliario</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto">Datos de mercado, tendencias de precios y guías para comprar, vender e invertir en bienes raíces en CDMX.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {cats.map(cat => (
            <button key={cat} type="button" onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${active === cat ? "bg-amber-600 text-white" : "border border-white/10 text-white/40 hover:text-white/70"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(post => (
            <article key={post.id} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-900/25 text-amber-400 border border-amber-800/25">{post.category}</span>
                <span className="text-[10px] text-white/20">{post.readTime} lectura</span>
              </div>
              <h2 className="font-bold text-white text-sm leading-snug mb-3 group-hover:text-amber-300 transition-colors">{post.title}</h2>
              <p className="text-xs text-white/30 leading-relaxed mb-5">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div><p className="text-[11px] text-white/40">{post.author}</p><p className="text-[10px] text-white/20">{post.date}</p></div>
                <span className="text-amber-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block">Leer →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#0a0702]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">¿Listo para comprar, vender o invertir?</p>
          <Link href="/webs/inmobiliaria/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Hablar con un agente
          </Link>
        </div>
      </section>
    </div>
  )
}
