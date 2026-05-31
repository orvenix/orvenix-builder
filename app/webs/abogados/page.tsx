"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Clock, Shield, Award } from "lucide-react"
import { stats, areas, processSteps, testimonials, faqs } from "./data/index"

export default function AbogadosHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-amber-900/6 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-900/4 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(180,140,50,0.03) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/25 border border-amber-700/25 text-amber-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Consultas disponibles · Lun–Vie 9:00–19:00
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Tu defensa</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">jurídica</span>
              <br />
              <span className="text-white/35">en manos expertas</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              18 años de experiencia. Más de 2,320 casos resueltos. Asesoría integral en derecho laboral, mercantil, familiar, penal, inmobiliario y corporativo.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
                Agendar consulta gratuita
              </Link>
              <Link href="/webs/abogados/servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver áreas de práctica →
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
      <div className="border-y border-white/[0.04] bg-white/[0.015] py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-xs text-white/25">
          {[
            { icon: Shield, text: "Confidencialidad garantizada" },
            { icon: CheckCircle, text: "Cédula profesional verificada" },
            { icon: Award, text: "Miembro ANADE & BARRA CDMX" },
            { icon: Clock, text: "Respuesta en menos de 4h" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-amber-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ÁREAS PREVIEW */}
      <section className="py-28 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-5">
              Especialidades
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Áreas de práctica</h2>
            <p className="text-white/35 max-w-xl mx-auto">Equipos especializados por materia jurídica. Cada área tiene un abogado líder con más de 10 años en esa especialidad.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {areas.map(a => {
              const Icon = a.icon
              return (
                <div key={a.id} className={`p-6 rounded-2xl border ${a.border} ${a.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{a.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{a.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${a.color}`}>{a.casos}</span>
                    <span className="text-white/25">{a.tasa}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/webs/abogados/servicios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-all text-sm font-semibold">
              Ver detalles de cada área →
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-gradient-to-b from-[#070b14] to-[#090d18]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestro proceso</h2>
            <p className="text-white/35">Método claro, sin sorpresas y con comunicación constante en cada etapa.</p>
          </div>
          <div className="space-y-4">
            {processSteps.map(s => (
              <div key={s.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="text-3xl font-black text-amber-900/50 w-12 shrink-0">{s.n}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS PREVIEW */}
      <section className="py-24 bg-[#090d18]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-amber-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 380 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {testimonials.slice(0, 3).map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700/60 border border-amber-900/30 px-2 py-0.5 rounded-full">{t.area}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/webs/abogados/testimonios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-amber-700/30 text-amber-400 hover:bg-amber-900/20 transition-all text-sm font-semibold">
              Ver todos los testimonios →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#070b14]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-gradient-to-r from-amber-950/30 to-[#070b14]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">¿Tienes un caso urgente?</h2>
          <p className="text-white/35 mb-8 max-w-xl mx-auto">Nuestros abogados están disponibles de lunes a viernes de 9:00 a 19:00. Para emergencias penales, atendemos las 24 horas.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
              Agendar consulta gratuita
            </Link>
            <a href="https://wa.me/5255555524" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              WhatsApp →
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
