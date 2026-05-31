"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award, Clock, Shield } from "lucide-react"
import { brand, stats, categories, destinos, process, team, testimonials, faqs } from "./data/index"

export default function ViajesHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-orange-900/6 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-rose-900/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(249,115,22,0.025) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/25 border border-orange-700/25 text-orange-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              {brand.iata} · Consulta sin costo · 14 años en el mercado
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">El mundo</span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-rose-300 to-pink-400 bg-clip-text text-transparent">en tus manos</span>
              <br />
              <span className="text-white/30">y presupuesto</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              Más de 48,000 viajeros felices. 120+ destinos. Paquetes nacionales, internacionales, cruceros, luna de miel y grupos. Asesores certificados IATA con asistencia 24/7.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/viajes/paquetes" className="px-8 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/30">
                Explorar paquetes
              </Link>
              <Link href="/webs/viajes/contacto" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Hablar con un asesor →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-orange-400">{s.value}</div>
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
            { icon: Award, text: "Certificación IATA verificada" },
            { icon: CheckCircle, text: "Seguro de viajero incluido" },
            { icon: Shield, text: "Pago a meses sin intereses" },
            { icon: Clock, text: "Asistencia 24/7 en destino" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-orange-700/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* DESTINOS DESTACADOS */}
      <section className="py-28 bg-[#08080f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-800/25 text-orange-500 text-xs mb-5">Destinos</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Los más elegidos</h2>
            <p className="text-white/35 max-w-xl mx-auto">Destinos seleccionados por demanda, calidad de experiencia y relación precio-valor. Precios por persona en base doble.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {destinos.map(d => (
              <div key={d.name} className={`p-6 rounded-2xl bg-gradient-to-br ${d.gradient} border border-white/[0.06] hover:scale-[1.01] transition-all relative overflow-hidden group`}>
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-white/70 border border-white/15">{d.tag}</span>
                </div>
                <div className="text-4xl mb-4">{d.emoji}</div>
                <h3 className="font-black text-white text-xl mb-1">{d.name}</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{d.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-white/35">{d.noches}</div>
                    <div className="font-black text-white">Desde {d.desde} <span className="text-[11px] font-normal text-white/40">MXN</span></div>
                  </div>
                  <Link href="/webs/viajes/contacto" className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
                    Ver paquete →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/webs/viajes/destinos" className="px-8 py-3 text-sm font-semibold rounded-xl border border-orange-800/30 text-orange-400 hover:bg-orange-900/15 transition-all">
              Ver todos los destinos →
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="py-24 bg-gradient-to-b from-[#08080f] to-[#0c080c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Tipos de viaje</h2>
            <p className="text-white/35 max-w-xl mx-auto">Para cada tipo de viajero y ocasión, tenemos el paquete perfecto.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map(c => {
              const Icon = c.icon
              return (
                <div key={c.id} className={`p-6 rounded-2xl border ${c.border} ${c.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{c.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 text-[10px] rounded-full ${c.bg} ${c.color} border ${c.border}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${c.color}`}>{c.desde}</span>
                    <span className="text-white/25">{c.popularidad}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-[#08080f]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Así organizamos tu viaje</h2>
            <p className="text-white/35">De la idea al aeropuerto: 5 pasos simples con un asesor dedicado.</p>
          </div>
          <div className="space-y-4">
            {process.map(p => (
              <div key={p.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="text-3xl font-black text-orange-900/50 w-12 shrink-0">{p.n}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{p.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-28 bg-[#0c080c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros asesores</h2>
            <p className="text-white/35">Especialistas certificados que han viajado a los destinos que te recomiendan. No vendemos desde una pantalla: conocemos cada destino.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-orange-400/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/18 text-center">{t.exp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#08080f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Viajeros que confían en nosotros</h2>
            <div className="flex items-center justify-center gap-2 text-orange-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 2,140 reseñas Google</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-900/25 flex items-center justify-center text-xs font-bold text-orange-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-orange-700/60 border border-orange-900/30 px-2 py-0.5 rounded-full">{t.destino}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#08080f]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#08080f] to-[#0a0609]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-5">¿A dónde quieres ir?</h2>
          <p className="text-white/35 text-lg mb-10 max-w-xl mx-auto">Cuéntanos tu destino soñado. En 24h te enviamos un itinerario personalizado con los mejores precios del mercado.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/viajes/contacto" className="px-10 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/30 text-lg">
              Cotizar mi viaje →
            </Link>
            <Link href="/webs/viajes/paquetes" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver paquetes
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
