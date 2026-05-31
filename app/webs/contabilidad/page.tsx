"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award, Clock, Shield } from "lucide-react"
import { brand, stats, services, process, team, planes, testimonials, faqs } from "./data/index"

export default function ContabilidadHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-teal-900/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-900/4 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,184,166,0.025) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/25 border border-teal-700/25 text-teal-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Diagnóstico fiscal gratuito · Sin compromiso
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Tu empresa,</span>
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">al corriente</span>
              <br />
              <span className="text-white/30">con el SAT</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              {new Date().getFullYear() - parseInt(brand.founded)} años resolviendo la contabilidad de 850+ empresas. Cero multas SAT, cero retrasos. Contadores certificados IMCP con plataforma digital incluida.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/contabilidad/contacto" className="px-8 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/30">
                Consulta fiscal gratis
              </Link>
              <Link href="/webs/contabilidad/planes" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver planes y precios →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-teal-400">{s.value}</div>
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
            { icon: Award, text: "Miembro IMCP certificado" },
            { icon: CheckCircle, text: "99.4% declaraciones a tiempo" },
            { icon: Shield, text: "Sin multas SAT garantizado" },
            { icon: Clock, text: "Respuesta en 48h máximo" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-teal-700/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS */}
      <section className="py-28 bg-[#070f14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/20 border border-teal-800/25 text-teal-500 text-xs mb-5">Especialidades</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Servicios contables</h2>
            <p className="text-white/35 max-w-xl mx-auto">Un despacho con todas las áreas que tu empresa necesita. De la contabilidad diaria a la planeación fiscal estratégica.</p>
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
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${s.color}`}>{s.clients}</span>
                    <span className="text-white/25">{s.tiempoResp}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="py-24 bg-gradient-to-b from-[#070f14] to-[#0a1419]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Planes y precios</h2>
            <p className="text-white/35">Precios fijos mensuales. Sin sorpresas ni cobros extras por consultas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map(plan => (
              <div key={plan.name} className={`p-6 rounded-2xl border transition-all ${plan.highlight ? "border-teal-600/50 bg-teal-950/20 ring-1 ring-teal-600/20" : "border-white/[0.07] bg-white/[0.02]"}`}>
                {plan.highlight && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-600 text-white">{plan.cta}</span>
                  </div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-white/35 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-black text-teal-400">{plan.price}</span>
                  <span className="text-sm text-white/30">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/45">
                      <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/webs/contabilidad/contacto" className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${plan.highlight ? "bg-teal-600 hover:bg-teal-500 text-white" : "border border-white/15 text-white/55 hover:text-white hover:border-white/30"}`}>
                  {plan.highlight ? "Comenzar ahora" : "Solicitar información"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-[#070f14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Cómo funciona</h2>
            <p className="text-white/35">Onboarding simple, rápido y sin interrumpir tu operación.</p>
          </div>
          <div className="space-y-4">
            {process.map(p => (
              <div key={p.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="text-3xl font-black text-teal-900/60 w-12 shrink-0">{p.n}</div>
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
      <section className="py-28 bg-[#0a1419]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">Contadores Públicos Certificados con experiencia en Big Four y organismos fiscales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-teal-400/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/18 text-center">{t.exp}</p>
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                  <span className="text-[10px] text-teal-800/50">{t.cedula}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#070f14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-teal-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-teal-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 610 reseñas Google</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-teal-700/60 border border-teal-900/30 px-2 py-0.5 rounded-full">{t.servicio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#070f14]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#070f14] to-[#050c10]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-5">¿Listo para estar al corriente?</h2>
          <p className="text-white/35 text-lg mb-10 max-w-xl mx-auto">Diagnóstico fiscal gratuito. En 48h te decimos exactamente en qué situación estás y qué necesitas regularizar.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/contabilidad/contacto" className="px-10 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/30 text-lg">
              Solicitar diagnóstico gratis →
            </Link>
            <Link href="/webs/contabilidad/planes" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
