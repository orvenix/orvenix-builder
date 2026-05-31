"use client"
import { useState } from "react"
import Link from "next/link"
import { blogPosts } from "../data/index"

const cats = ["Todos", "Tips & Consejos", "Técnica", "Bodas", "Corporativo", "Producto"]

export default function FotografiaBlog() {
  const [active, setActive] = useState("Todos")
  const filtered = active === "Todos" ? blogPosts : blogPosts.filter(p => p.category === active)

  return (
    <div className="min-h-screen bg-[#080708]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-yellow-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-400 text-xs mb-6">Blog</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Detrás del</span>{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">lente</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Consejos, técnica y proyectos. Escrito por el equipo de {"{"}brand.name{"}"} con más de 9 años de experiencia.</p>
        </div>
      </section>

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

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(post => (
            <article key={post.id} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-900/25 text-yellow-400 border border-yellow-800/25">{post.category}</span>
                <span className="text-[10px] text-white/20">{post.readTime} lectura</span>
              </div>
              <h2 className="font-bold text-white text-sm leading-snug mb-3 group-hover:text-yellow-300 transition-colors">{post.title}</h2>
              <p className="text-xs text-white/30 leading-relaxed mb-5">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="text-[11px] text-white/40">{post.author}</p>
                  <p className="text-[10px] text-white/20">{post.date}</p>
                </div>
                <span className="text-yellow-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block">Leer →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#080708] to-[#0b090a]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Tips en tu bandeja de entrada</h2>
          <p className="text-white/35 mb-8">Guías de sesiones, técnica fotográfica y novedades del estudio. Máximo una vez al mes.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="tu@correo.com" className="flex-1 px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/45 text-sm" />
            <button type="button" className="px-6 py-3 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all text-sm shrink-0">Suscribirse</button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#080708]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/40 mb-4">¿Tienes un proyecto en mente?</p>
          <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30 inline-block">
            Reservar sesión
          </Link>
        </div>
      </section>
    </div>
  )
}
