"use client"
import { useState } from "react"
import Link from "next/link"
import { blogPosts } from "../data/index"

const categories = ["Todos", "Laboral", "Inmobiliario", "Familiar", "Corporativo", "Penal", "Mercantil"]

export default function AbogadosBlog() {
  const [activeCategory, setActiveCategory] = useState("Todos")

  const filtered = activeCategory === "Todos"
    ? blogPosts
    : blogPosts.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-amber-900/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            Blog jurídico
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Derecho al</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">alcance de todos</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg">
            Análisis legal claro, actualizado y sin tecnicismos innecesarios. Escrito por los abogados del despacho.
          </p>
        </div>
      </section>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-amber-700 text-white"
                  : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ARTÍCULOS */}
      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(post => (
            <article key={post.id} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-900/25 text-amber-400 border border-amber-800/25">
                  {post.category}
                </span>
                <span className="text-[10px] text-white/20">{post.readTime} lectura</span>
              </div>
              <h2 className="font-bold text-white text-sm leading-snug mb-3 group-hover:text-amber-300 transition-colors">
                {post.title}
              </h2>
              <p className="text-xs text-white/30 leading-relaxed mb-5">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="text-[11px] text-white/40">{post.author}</p>
                  <p className="text-[10px] text-white/20">{post.date}</p>
                </div>
                <span className="text-amber-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-block">
                  Leer →
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SUSCRIPCIÓN */}
      <section className="py-20 bg-gradient-to-b from-[#070b14] to-[#090d18]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Recibe alertas legales</h2>
          <p className="text-white/35 mb-8">Reformas, sentencias clave y guías prácticas. Directo a tu correo, sin spam.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="flex-1 px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm"
            />
            <button type="button" className="px-6 py-3 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all text-sm shrink-0">
              Suscribirse
            </button>
          </div>
          <p className="text-xs text-white/20 mt-3">Sin spam. Cancela cuando quieras.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#070b14]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/40 mb-4">¿Tienes un caso legal que resolver?</p>
          <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Consulta gratuita con un abogado
          </Link>
        </div>
      </section>
    </div>
  )
}
