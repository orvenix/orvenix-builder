"use client"
import { useState } from "react"
import Link from "next/link"
import { blogPosts } from "../data/index"

const cats = ["Todos", "Entrenamiento", "Nutrición", "Recuperación", "Pilates"]

export default function GimnasioBlog() {
  const [active, setActive] = useState("Todos")
  const filtered = active === "Todos" ? blogPosts : blogPosts.filter(p => p.category === active)

  return (
    <div className="min-h-screen bg-[#0f0804]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-orange-900/8 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/20 border border-orange-700/25 text-orange-400 text-xs mb-6">Escrito por nuestros coaches</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Blog de</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">fitness</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto">Sin mitos, sin pseudociencia. Solo información verificada para mejorar tu rendimiento.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {cats.map(cat => (
            <button key={cat} type="button" onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${active === cat ? "bg-orange-600 text-white" : "border border-white/10 text-white/40 hover:text-white/70"}`}>
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
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-orange-900/25 text-orange-400 border border-orange-800/25">{post.category}</span>
                <span className="text-[10px] text-white/20">{post.readTime} lectura</span>
              </div>
              <h2 className="font-bold text-white text-sm leading-snug mb-3 group-hover:text-orange-300 transition-colors">{post.title}</h2>
              <p className="text-xs text-white/30 leading-relaxed mb-5">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div><p className="text-[11px] text-white/40">{post.author}</p><p className="text-[10px] text-white/20">{post.date}</p></div>
                <span className="text-orange-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block">Leer →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#0a0502]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">El conocimiento sin acción no cambia nada. ¡Empieza hoy!</p>
          <Link href="/webs/gimnasio/contacto" className="px-8 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/30 inline-block">
            Prueba 7 días gratis
          </Link>
        </div>
      </section>
    </div>
  )
}
