"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, CheckCircle, Clock, Shield, Award, Users } from "lucide-react"
import { stats, products, processSteps, testimonials, faqs } from "./data/index"

export default function SegurosHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-blue-900/6 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-indigo-900/4 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.025) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/25 border border-blue-700/25 text-blue-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Corredor independiente · Sin conflicto de interés
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">El seguro</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">correcto</span>
              <br />
              <span className="text-white/35">al precio justo</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              16 años protegiendo lo que más importa. Somos corredores independientes: comparamos más de 12 aseguradoras y trabajamos para ti, no para ellas.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/seguros/contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30">
                Cotizar gratis ahora
              </Link>
              <Link href="/webs/seguros/productos" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver todos los seguros →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-blue-400">{s.value}</div>
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
            { icon: Shield, text: "CNSF Clave 18-642-I" },
            { icon: Users, text: "+12,400 pólizas administradas" },
            { icon: CheckCircle, text: "98% reclamaciones pagadas" },
            { icon: Award, text: "Miembro AMIS · 16 años" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-blue-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTOS PREVIEW */}
      <section className="py-28 bg-[#06090f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800/25 text-blue-400 text-xs mb-5">
              Nuestros productos
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Protección para cada etapa</h2>
            <p className="text-white/35 max-w-xl mx-auto">Desde tu primer auto hasta el retiro de tus sueños. Asesoramos en cada decisión de seguros de tu vida.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {products.map(p => {
              const Icon = p.icon
              return (
                <div key={p.id} className={`p-6 rounded-2xl border ${p.border} ${p.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${p.color}`}>{p.desde}</span>
                    <span className="text-white/25">{p.aseguradoras.length} aseg.</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/webs/seguros/productos" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-700/30 text-blue-400 hover:bg-blue-900/20 transition-all text-sm font-semibold">
              Ver detalles y cotizar →
            </Link>
          </div>
        </div>
      </section>

      {/* POR QUÉ UN CORREDOR */}
      <section className="py-20 bg-gradient-to-b from-[#06090f] to-[#080c14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">¿Por qué un corredor independiente?</h2>
            <p className="text-white/35 max-w-lg mx-auto">Un agente de la aseguradora trabaja para la aseguradora. Nosotros trabajamos para ti.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Comparamos todo el mercado", desc: "Acceso a +12 aseguradoras. Te presentamos la mejor opción, no la que más comisión genera.", icon: "🔍" },
              { title: "Gratuito para el cliente", desc: "Cobramos comisión a la aseguradora, no a ti. La prima que pagas es la misma que si fueras directo.", icon: "💸" },
              { title: "Te defendemos en siniestros", desc: "Cuando tienes un siniestro, nos ponemos de tu lado. Presentamos, negociamos y seguimos hasta que cobres.", icon: "🛡️" },
              { title: "Revisión anual incluida", desc: "Cada año revisamos tus coberturas para que estés siempre bien protegido al mejor precio del mercado.", icon: "🔄" },
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
      <section className="py-24 bg-[#080c14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Cómo funciona</h2>
            <p className="text-white/35">Desde la primera llamada hasta tener tu póliza emitida, en un proceso claro y sin complicaciones.</p>
          </div>
          <div className="space-y-4">
            {processSteps.map(s => (
              <div key={s.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="text-3xl font-black text-blue-900/60 w-12 shrink-0">{s.n}</div>
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
      <section className="py-24 bg-[#06090f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-blue-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-blue-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 640 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {testimonials.slice(0, 3).map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-700/60 border border-blue-900/30 px-2 py-0.5 rounded-full">{t.product}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/webs/seguros/testimonios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-700/30 text-blue-400 hover:bg-blue-900/20 transition-all text-sm font-semibold">
              Ver todos los testimonios →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#06090f]">
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
                  <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
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
      <section className="py-20 bg-gradient-to-r from-blue-950/30 to-[#06090f]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">¿Tienes dudas sobre tus seguros actuales?</h2>
          <p className="text-white/35 mb-8 max-w-xl mx-auto">Revisamos tus pólizas sin costo. Si ya tienes buenos seguros, te lo decimos. Si puedes mejorarlos, te mostramos cómo.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/seguros/contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30">
              Cotización gratuita
            </Link>
            <a href={`https://wa.me/${52556677880}`} className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              WhatsApp →
            </a>
          </div>
          <p className="text-xs text-white/20 mt-6 flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Respuesta en menos de 2 horas hábiles
          </p>
        </div>
      </section>
    </>
  )
}
