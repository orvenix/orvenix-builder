"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award, Clock, Shield } from "lucide-react"
import { brand, stats, services, process, team, testimonials, faqs } from "./data/index"

export default function ArquitecturaHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-amber-900/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-stone-800/8 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(180,140,60,0.025) 1px, transparent 0)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Agenda tu consulta · Sin costo · Sin compromiso
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Espacios que</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-stone-400 bg-clip-text text-transparent">inspiran</span>
              <br />
              <span className="text-white/30">y perduran</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              {new Date().getFullYear() - parseInt(brand.founded)} años diseñando arquitectura residencial, comercial y de interiores que refleja la identidad de cada cliente. Más de 240 proyectos entregados en México.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/arquitectura/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
                Solicitar consulta gratuita
              </Link>
              <Link href="/webs/arquitectura/proyectos" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver proyectos →
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
            { icon: Award, text: "12 premios de diseño ARQUINE" },
            { icon: CheckCircle, text: "Cédulas profesionales verificadas" },
            { icon: Shield, text: "Garantía 12 meses en instalaciones" },
            { icon: Clock, text: "Consulta inicial sin costo" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-amber-700/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS */}
      <section className="py-28 bg-[#0a0908]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-5">Especialidades</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Lo que hacemos</h2>
            <p className="text-white/35 max-w-xl mx-auto">Equipos especializados por tipología. No somos generalistas: cada proyecto tiene un arquitecto líder con experiencia comprobada en esa área.</p>
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
                    <span className={`font-bold ${s.color}`}>{s.proyectos}</span>
                    <span className="text-white/25">{s.satisfaccion}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/webs/arquitectura/servicios" className="px-8 py-3 text-sm font-semibold rounded-xl border border-amber-800/30 text-amber-400 hover:bg-amber-900/15 transition-all">
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-gradient-to-b from-[#0a0908] to-[#0d0b09]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestro proceso</h2>
            <p className="text-white/35">Método claro, con comunicación constante y entregables concretos en cada etapa del proyecto.</p>
          </div>
          <div className="space-y-4">
            {process.map(p => (
              <div key={p.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="text-3xl font-black text-amber-900/50 w-12 shrink-0">{p.n}</div>
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
      <section className="py-28 bg-[#0a0908]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">Arquitectos e ingenieros con cédula profesional verificable, trayectoria internacional y premios de diseño.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-amber-400/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/18 text-center">{t.exp}</p>
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                  <span className="text-[10px] text-amber-800/50">{t.cedula}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/webs/arquitectura/nosotros" className="px-8 py-3 text-sm font-semibold rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
              Conocer el estudio →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0d0b09]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-amber-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 420 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-900/25 flex items-center justify-center text-xs font-bold text-amber-400">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
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
      <section className="py-20 bg-[#0a0908]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
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

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-b from-[#0a0908] to-[#0f0c08]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Consulta inicial sin costo
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5">¿Listo para crear algo extraordinario?</h2>
          <p className="text-white/35 text-lg mb-10 max-w-xl mx-auto">Cuéntanos tu proyecto. En menos de 24h un arquitecto del equipo te contacta para agendar la visita al predio.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/arquitectura/contacto" className="px-10 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 text-lg">
              Iniciar proyecto →
            </Link>
            <Link href="/webs/arquitectura/proyectos" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver portafolio
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
