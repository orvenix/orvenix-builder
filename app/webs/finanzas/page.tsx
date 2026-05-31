"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Shield, Award, BarChart3 } from "lucide-react"
import { stats, services, processSteps, testimonials, faqs } from "./data/index"

export default function FinanzasHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-emerald-900/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-900/4 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(16,185,129,0.02) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/25 border border-emerald-700/25 text-emerald-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Asesor fiduciario · Regulado por CNBV · Clave 07-432-I
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Tu patrimonio,</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">nuestra estrategia</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              14 años asesorando a 620+ familias y empresas. $3.2 B MXN bajo asesoría. Somos fiduciarios independientes: no vendemos productos, diseñamos estrategias en tu mejor interés.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/finanzas/contacto" className="px-8 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/30">
                Diagnóstico financiero gratis
              </Link>
              <Link href="/webs/finanzas/servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Nuestros servicios →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-emerald-400">{s.value}</div>
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
            { icon: Shield, text: "CNBV · Clave 07-432-I" },
            { icon: BarChart3, text: "18.4% rendimiento promedio anual" },
            { icon: CheckCircle, text: "Asesor fiduciario independiente" },
            { icon: Award, text: "CFA® & CFP® en el equipo" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-emerald-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS PREVIEW */}
      <section className="py-28 bg-[#040f0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/20 border border-emerald-800/25 text-emerald-400 text-xs mb-5">
              Nuestros servicios
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Asesoría integral</h2>
            <p className="text-white/35 max-w-xl mx-auto">Desde la primera inversión hasta la transmisión patrimonial a tus hijos. Un solo equipo para todo el ciclo financiero.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {services.map(s => {
              const Icon = s.icon
              return (
                <div key={s.id} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{s.desc}</p>
                  <div className="pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${s.color}`}>{s.minimo}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/webs/finanzas/servicios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/20 transition-all text-sm font-semibold">
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="py-20 bg-gradient-to-b from-[#040f0a] to-[#060f0b]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Por qué un asesor fiduciario</h2>
            <p className="text-white/35 max-w-lg mx-auto">La mayoría de los &quot;asesores&quot; financieros en México cobran comisiones por vender productos. Un fiduciario está obligado legalmente a actuar en tu interés.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Sin conflictos de interés", desc: "No vendemos fondos propios ni recibimos comisiones de proveedores. Solo cobramos por asesoría. Punto.", icon: "⚖️" },
              { title: "Obligación fiduciaria", desc: "Registrados ante CNBV como Asesores en Inversiones. Legalmente obligados a anteponer tu interés al nuestro.", icon: "📋" },
              { title: "Acceso al mercado completo", desc: "Sin restricciones de catálogo. Recomendamos lo mejor del mercado, no lo que más comisión genera.", icon: "🌐" },
              { title: "Transparencia total de costos", desc: "Sabes exactamente cuánto cobran los fondos, cuánto cobra la custodia y cuánto cobramos nosotros. Sin letra chica.", icon: "💡" },
            ].map(item => (
              <div key={item.title} className="flex gap-4 p-6 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-[#060f0b]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Así trabajamos</h2>
            <p className="text-white/35">Desde el diagnóstico hasta el seguimiento continuo.</p>
          </div>
          <div className="space-y-4">
            {processSteps.map(s => (
              <div key={s.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="text-3xl font-black text-emerald-900/60 w-12 shrink-0">{s.n}</div>
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
      <section className="py-24 bg-[#040f0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-emerald-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-emerald-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 420 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {testimonials.slice(0, 3).map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700/60 border border-emerald-900/30 px-2 py-0.5 rounded-full">{t.service}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/webs/finanzas/testimonios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/20 transition-all text-sm font-semibold">
              Ver todos los testimonios →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#040f0a]">
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
                  <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-950/30 to-[#040f0a]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">¿Tu patrimonio está trabajando para ti?</h2>
          <p className="text-white/35 mb-8 max-w-xl mx-auto">Diagnóstico financiero gratuito. Sin compromiso. Si ya tienes una buena estrategia, te lo decimos. Si no, te mostramos cómo mejorarla.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/finanzas/contacto" className="px-8 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/30">
              Diagnóstico financiero gratis
            </Link>
            <Link href="/webs/finanzas/servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver servicios →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
