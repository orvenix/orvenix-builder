"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Award, Clock, Shield } from "lucide-react"
import { brand, stats, tramites, process, equipo, testimonials, faqs } from "./data/index"

export default function NotariaHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-yellow-900/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-900/4 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(161,119,32,0.025) 1px, transparent 0)", backgroundSize: "56px 56px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-500 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              {brand.protocolo} · {brand.colegiado}
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Fe pública,</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">certeza</span>
              <br />
              <span className="text-white/30">jurídica</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-8">
              {new Date().getFullYear() - parseInt(brand.founded)} años de servicio notarial. Más de 120,000 instrumentos protocolizados. Escrituración, testamentos, poderes y sociedades mercantiles con la mayor certeza legal.
            </p>
            <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-900/10 border border-yellow-800/20 inline-flex items-center gap-3">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-400/80 font-medium">{brand.notario} · Notario Público No. 88 CDMX</span>
            </div>
            <br />
            <div className="flex items-center gap-4 flex-wrap mb-16 mt-6">
              <Link href="/webs/notaria/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all shadow-xl shadow-yellow-900/30">
                Solicitar cita
              </Link>
              <Link href="/webs/notaria/tramites" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver trámites →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-yellow-500">{s.value}</div>
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
            { icon: Award, text: "35 años de trayectoria notarial" },
            { icon: CheckCircle, text: "120K+ instrumentos firmados" },
            { icon: Shield, text: "Confidencialidad absoluta" },
            { icon: Clock, text: "Respuesta en 24 horas" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-yellow-700/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* TRÁMITES */}
      <section className="py-28 bg-[#080a0e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-5">Servicios notariales</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Trámites que realizamos</h2>
            <p className="text-white/35 max-w-xl mx-auto">Cobertura completa de actos notariales. Asesoría jurídica incluida en cada trámite para que tomes las mejores decisiones patrimoniales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tramites.map(t => {
              const Icon = t.icon
              return (
                <div key={t.id} className={`p-6 rounded-2xl border ${t.border} ${t.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${t.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{t.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 text-[10px] rounded-full ${t.bg} ${t.color} border ${t.border}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="space-y-1 pt-3 border-t border-white/5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/25">Plazo estimado</span>
                      <span className={`font-bold ${t.color}`}>{t.plazo}</span>
                    </div>
                    <p className="text-white/20">{t.nota}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/webs/notaria/tramites" className="px-8 py-3 text-sm font-semibold rounded-xl border border-yellow-800/30 text-yellow-400 hover:bg-yellow-900/15 transition-all">
              Ver información de trámites →
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-24 bg-gradient-to-b from-[#080a0e] to-[#0b0d12]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Proceso notarial</h2>
            <p className="text-white/35">Transparencia total en cada etapa. Siempre sabrás en qué paso está tu trámite.</p>
          </div>
          <div className="space-y-4">
            {process.map(p => (
              <div key={p.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="text-3xl font-black text-yellow-900/50 w-12 shrink-0">{p.n}</div>
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
      <section className="py-28 bg-[#080a0e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El despacho notarial</h2>
            <p className="text-white/35">El Notario y su equipo jurídico especializado en cada área del derecho notarial.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {equipo.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-yellow-500/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/18 text-center">{t.exp}</p>
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                  <span className="text-[10px] text-yellow-800/50">{t.cedula}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0b0d12]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Clientes que confían en nosotros</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 890 reseñas Google Maps</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-900/25 flex items-center justify-center text-xs font-bold text-yellow-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-yellow-700/60 border border-yellow-900/30 px-2 py-0.5 rounded-full">{t.tramite}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#080a0e]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-yellow-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#080a0e] to-[#06080c]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-400 text-xs mb-6">
            <Shield className="w-3.5 h-3.5" />
            Confidencialidad absoluta garantizada
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5">¿Necesitas un trámite notarial?</h2>
          <p className="text-white/35 text-lg mb-10 max-w-xl mx-auto">Agenda tu cita. El equipo del Lic. Velázquez Ponce te atenderá en 24h para orientarte sin compromiso.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/notaria/contacto" className="px-10 py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all shadow-xl shadow-yellow-900/30 text-lg">
              Solicitar cita →
            </Link>
            <Link href="/webs/notaria/tarifas" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver tarifas
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
