"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award, Clock, TrendingUp } from "lucide-react"
import { brand, stats, services, metodologia, team, casos, testimonials, faqs } from "./data/index"

export default function RRHHHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-violet-900/6 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.025) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/25 border border-violet-700/25 text-violet-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Diagnóstico gratuito · Sin compromiso · Resultados medibles
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">El talento</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">como ventaja</span>
              <br />
              <span className="text-white/30">competitiva</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              {new Date().getFullYear() - parseInt(brand.founded)} años transformando áreas de RRHH en motores de crecimiento. 320+ empresas. 12K+ posiciones reclutadas. Resultados medibles desde el primer mes.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/rrhh/contacto" className="px-8 py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-xl shadow-violet-900/30">
                Diagnóstico gratuito
              </Link>
              <Link href="/webs/rrhh/casos" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver casos de éxito →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-violet-400">{s.value}</div>
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
            { icon: Award, text: "Certificados SHRM & ICF" },
            { icon: CheckCircle, text: "91% retención a 12 meses" },
            { icon: TrendingUp, text: "ROI medible desde el 1er mes" },
            { icon: Clock, text: "18 días promedio de cobertura" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-violet-700/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS */}
      <section className="py-28 bg-[#090714]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/25 text-violet-500 text-xs mb-5">Servicios</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Consultoría integral de RRHH</h2>
            <p className="text-white/35 max-w-xl mx-auto">Soluciones end-to-end para el ciclo completo del talento: atracción, desarrollo, retención y salida. Con métricas claras en cada etapa.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => {
              const Icon = s.icon
              return (
                <div key={s.id} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 text-[10px] rounded-full ${s.bg} ${s.color} border ${s.border}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="space-y-1 pt-3 border-t border-white/5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${s.color}`}>{s.kpi}</span>
                    </div>
                    <p className="text-white/20">{s.garantia}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CASOS DE ÉXITO */}
      <section className="py-24 bg-gradient-to-b from-[#090714] to-[#0c0916]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Casos de éxito</h2>
            <p className="text-white/35">Resultados reales en empresas reales. Números antes y después.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {casos.map(c => (
              <div key={c.empresa} className={`p-6 rounded-2xl bg-gradient-to-br ${c.gradient} border border-white/[0.07] hover:scale-[1.01] transition-all`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{c.sector}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/60 border border-white/15">Caso real</span>
                </div>
                <h3 className="font-black text-white text-lg mb-3">{c.empresa}</h3>
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Reto</div>
                    <p className="text-sm text-white/55">{c.reto}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Solución</div>
                    <p className="text-sm text-white/55">{c.solucion}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="text-[10px] text-violet-300/60 uppercase tracking-wider mb-1">Resultado</div>
                  <p className="font-bold text-violet-300">{c.resultado}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/webs/rrhh/casos" className="px-8 py-3 text-sm font-semibold rounded-xl border border-violet-800/30 text-violet-400 hover:bg-violet-900/15 transition-all">
              Ver todos los casos de éxito →
            </Link>
          </div>
        </div>
      </section>

      {/* METODOLOGÍA */}
      <section className="py-24 bg-[#090714]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestra metodología</h2>
            <p className="text-white/35">Un proceso probado que garantiza resultados sostenibles, no soluciones parche.</p>
          </div>
          <div className="space-y-4">
            {metodologia.map(m => (
              <div key={m.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="text-3xl font-black text-violet-900/60 w-12 shrink-0">{m.n}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{m.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-28 bg-[#0c0916]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">Consultores con experiencia en Big Four, firmas globales y empresas Fortune 500 de México.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-violet-400/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/18 text-center">{t.exp}</p>
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                  <span className="text-[10px] text-violet-800/50">{t.cedula}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#090714]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-violet-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-violet-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 340 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-violet-700/60 border border-violet-900/30 px-2 py-0.5 rounded-full">{t.servicio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#090714]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-violet-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#090714] to-[#060411]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-5">¿Tu área de RRHH ya es estratégica?</h2>
          <p className="text-white/35 text-lg mb-10 max-w-xl mx-auto">Diagnóstico gratuito de madurez en gestión de talento. En 48h sabrás exactamente qué está frenando el crecimiento de tu empresa.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/rrhh/contacto" className="px-10 py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-xl shadow-violet-900/30 text-lg">
              Solicitar diagnóstico →
            </Link>
            <Link href="/webs/rrhh/servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver servicios
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
