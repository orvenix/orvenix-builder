"use client"
import { useState } from "react"
import Link from "next/link"
import { Star, ChevronDown, Camera, Award, Clock, CheckCircle } from "lucide-react"
import { stats, services, testimonials, faqs, portfolio } from "./data/index"

const PORTFOLIO_CATS = ["Todos", "Bodas", "Corporativo", "Quinceañeras", "Retratos", "Producto", "Video"]

export default function FotografiaHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activecat, setActivecat] = useState("Todos")

  const visiblePortfolio = activecat === "Todos"
    ? portfolio
    : portfolio.filter(p => p.category === activecat)

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-yellow-900/8 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-900/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(234,179,8,0.02) 1px, transparent 0)", backgroundSize: "52px 52px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/25 border border-yellow-700/25 text-yellow-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Estudio disponible · CDMX y todo México
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Historias</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">que se ven</span>
              <br />
              <span className="text-white/30">momentos que perduran</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              9 años documentando bodas, eventos corporativos, retratos y sesiones de producto. Equipo profesional, edición artística y entrega puntual.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30">
                Reservar sesión
              </Link>
              <Link href="/webs/fotografia/portafolio" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver portafolio →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-yellow-400">{s.value}</div>
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
            { icon: Camera, text: "Canon Explorer of Light" },
            { icon: Award, text: "Sony Ambassador México" },
            { icon: CheckCircle, text: "Drone certificado AFAC" },
            { icon: Clock, text: "Entrega en tiempo acordado" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-yellow-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS PREVIEW */}
      <section className="py-28 bg-[#080708]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-5">Servicios</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Capturamos cada momento</h2>
            <p className="text-white/35 max-w-xl mx-auto">Desde tu boda hasta el headshot que define tu marca. Equipo completo, visión artística.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {services.slice(0, 6).map(s => {
              const Icon = s.icon
              return (
                <div key={s.id} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{s.desc}</p>
                  <div className="pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold ${s.color}`}>{s.desde}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link href="/webs/fotografia/servicios" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-yellow-700/30 text-yellow-400 hover:bg-yellow-900/20 transition-all text-sm font-semibold">
              Ver todos los servicios y paquetes →
            </Link>
          </div>
        </div>
      </section>

      {/* PORTAFOLIO PREVIEW */}
      <section className="py-20 bg-gradient-to-b from-[#080708] to-[#0b090a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Portafolio</h2>
            <p className="text-white/35">Una muestra del trabajo que nos enorgullece.</p>
          </div>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {PORTFOLIO_CATS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActivecat(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activecat === cat ? "bg-yellow-500 text-black" : "border border-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {visiblePortfolio.map(item => (
              <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] aspect-[4/3] flex items-end hover:border-yellow-700/30 transition-all cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-black/40" />
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                  <Camera className="w-16 h-16 text-yellow-400" />
                </div>
                <div className="relative p-4 w-full">
                  <span className="text-[10px] text-yellow-400/70 font-bold uppercase tracking-wider">{item.category}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{item.title}</p>
                  <p className="text-xs text-white/30">{item.location} · {item.year}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/webs/fotografia/portafolio" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-yellow-700/30 text-yellow-400 hover:bg-yellow-900/20 transition-all text-sm font-semibold">
              Ver portafolio completo →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0b090a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Clientes que confían en nosotros</h2>
            <div className="flex items-center justify-center gap-1 text-yellow-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 420 reseñas verificadas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.slice(0, 3).map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-900/30 flex items-center justify-center text-xs font-bold text-yellow-400">{t.avatar}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/25">{t.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-yellow-700/60 border border-yellow-900/30 px-2 py-0.5 rounded-full">{t.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#080708]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-yellow-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
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
      <section className="py-20 bg-gradient-to-r from-yellow-950/30 to-[#080708]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">¿Tienes un evento o proyecto en mente?</h2>
          <p className="text-white/35 mb-8 max-w-xl mx-auto">Verificamos disponibilidad y te enviamos una propuesta personalizada en menos de 24 horas.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30">
              Reservar fecha
            </Link>
            <Link href="/webs/fotografia/servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Ver paquetes →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
