"use client"
import Link from "next/link"
import { servicios, testimonials } from "../data/index"
import { Star } from "lucide-react"

export default function HotelServicios() {
  return (
    <div className="min-h-screen bg-[#100c06]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-amber-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">Servicios de lujo</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Servicios</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-stone-400 bg-clip-text text-transparent">& Amenidades</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Todo lo que necesitas para que tu estadía sea memorable, sin que tengas que salir del hotel.</p>
        </div>
      </section>

      <section className="pb-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {servicios.map(s => {
            const Icon = s.icon
            return (
              <div key={s.name} className={`p-7 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all`}>
                <Icon className={`w-7 h-7 ${s.color} mb-4`} />
                <h3 className="text-xl font-bold text-white mb-2">{s.name}</h3>
                <p className="text-white/40 leading-relaxed mb-4 text-sm">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map(t => <span key={t} className={`px-2.5 py-0.5 text-[10px] rounded-full ${s.bg} ${s.color} border ${s.border}`}>{t}</span>)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-[#0c0904]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">Lo que dicen nuestros huéspedes</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              <span className="text-white/30 text-sm ml-2">4.9 · 1,840 reseñas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-400">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-[11px] text-white/25">{t.handle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700/60 border border-amber-900/30 px-2 py-0.5 rounded-full">{t.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#100c06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">Experimenta el lujo en persona</p>
          <Link href="/webs/hotel/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Reservar estancia
          </Link>
        </div>
      </section>
    </div>
  )
}
