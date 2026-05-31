"use client"
import Link from "next/link"
import { entrenadores } from "../data/index"

export default function GimnasioEntrenadores() {
  return (
    <div className="min-h-screen bg-[#0f0804]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-orange-900/8 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/20 border border-orange-700/25 text-orange-400 text-xs mb-6">Certificados internacionalmente</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestros</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">coaches</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">No solo saben de ejercicio — saben enseñar. Todos con más de 9 años de experiencia y certificaciones internacionales vigentes.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entrenadores.map(e => (
            <div key={e.name} className="p-7 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-5">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${e.color} flex items-center justify-center text-2xl font-black text-white shrink-0`}>{e.avatar}</div>
              <div>
                <h3 className="font-bold text-white mb-0.5">{e.name}</h3>
                <p className="text-xs text-orange-400/80 mb-0.5">{e.specialty}</p>
                <p className="text-[11px] text-white/25 mb-3">{e.cert}</p>
                <p className="text-xs text-white/40 leading-relaxed">{e.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#0a0502]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">¿Quieres entrenar con uno de ellos?</h2>
          <p className="text-white/35 mb-8">Las membresías Premium y Elite incluyen sesiones de personal training.</p>
          <Link href="/webs/gimnasio/contacto" className="px-8 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/30 inline-block">
            Ver membresías
          </Link>
        </div>
      </section>
    </div>
  )
}
