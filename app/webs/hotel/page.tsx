"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award } from "lucide-react"
import { stats, habitaciones, servicios, testimonials, faqs, paquetes } from "./data/index"

export default function HotelHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-amber-900/6 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-stone-900/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(180,120,40,0.02) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              <span className="text-white/40 text-sm ml-1">Hotel de Lujo · Paseo de la Reforma</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Donde el lujo</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-stone-300 to-amber-300 bg-clip-text text-transparent">se siente en casa</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              86 habitaciones y suites con vista panorámica de CDMX. Spa de 2,000 m², restaurante en el piso 22, alberca infinity y concierge 24/7.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/hotel/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
                Reservar estancia
              </Link>
              <Link href="/webs/hotel/habitaciones" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver habitaciones →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-amber-400">{s.value}</div>
                  <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-white/[0.04] bg-white/[0.01] py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-xs text-white/25">
          {[
            { icon: Award, text: "TripAdvisor Certificate of Excellence 2024" },
            { icon: Star, text: "4.9 · 1,840 reseñas verificadas" },
            { icon: CheckCircle, text: "Mejor precio garantizado al reservar directo" },
            { icon: CheckCircle, text: "Cancelación gratuita con 48h de anticipación" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-amber-600/50" />{text}</div>
          ))}
        </div>
      </div>

      {/* HABITACIONES PREVIEW */}
      <section className="py-28 bg-[#100c06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-5">Alojamiento</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Habitaciones & Suites</h2>
            <p className="text-white/35 max-w-xl mx-auto">Desde habitaciones superiores hasta la Suite Presidencial de 120 m² con jacuzzi y butler service.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {habitaciones.slice(0, 4).map(h => (
              <div key={h.name} className={`p-6 rounded-2xl border ${h.border} ${h.bg} hover:scale-[1.01] transition-all`}>
                {h.badge && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${h.bg} ${h.color} border ${h.border} inline-block mb-2`}>{h.badge}</span>}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-white">{h.name}</h3>
                  <p className={`text-lg font-black ${h.color} shrink-0`}>{h.price}<span className="text-xs font-normal text-white/25">/noche</span></p>
                </div>
                <p className="text-xs text-white/35 mb-3">📐 {h.size} · 🏙️ {h.view} · 👤 hasta {h.guests} huéspedes</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {h.amenities.slice(0, 3).map(a => <span key={a} className={`px-2 py-0.5 text-[10px] rounded-full ${h.bg} ${h.color} border ${h.border}`}>{a}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/webs/hotel/habitaciones" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-all text-sm font-semibold">
              Ver todas las habitaciones →
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICIOS PREVIEW */}
      <section className="py-20 bg-gradient-to-b from-[#100c06] to-[#0c0904]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-white text-center mb-12">Servicios & Amenidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {servicios.slice(0, 3).map(s => {
              const Icon = s.icon
              return (
                <div key={s.name} className={`p-6 rounded-2xl border ${s.border} ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color} mb-3`} />
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/webs/hotel/servicios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-all text-sm font-semibold">
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* PAQUETES */}
      <section className="py-20 bg-[#0c0904]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-10">Paquetes especiales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paquetes.map(p => (
              <div key={p.name} className={`p-5 rounded-2xl border text-center ${p.highlight ? "border-amber-600/40 bg-amber-950/20" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1">{p.name}</h3>
                <p className="text-[10px] text-amber-400/70">{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#100c06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros huéspedes</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 1,840 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testimonials.slice(0, 4).map(t => (
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

      {/* FAQ */}
      <section className="py-20 bg-[#0c0904]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-950/30 to-[#100c06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">Tu estancia perfecta en CDMX te espera</h2>
          <p className="text-white/35 mb-8 max-w-xl mx-auto">Mejor precio garantizado al reservar directamente. Confirmación en 2 horas.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/hotel/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
              Verificar disponibilidad
            </Link>
            <Link href="/webs/hotel/habitaciones" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver habitaciones →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
