"use client"
import Link from "next/link"
import { brand, team, values } from "../data/index"

export default function FinanzasNosotros() {
  return (
    <div className="min-h-screen bg-[#040f0a]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-emerald-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-700/25 text-emerald-400 text-xs mb-6">
            Quiénes somos
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Asesores que</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">actúan en tu favor</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Fundada en {brand.founded} con una convicción: México necesita asesores financieros que trabajen para el cliente, no para las instituciones. Por eso somos fiduciarios independientes.
          </p>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Nuestra historia</h2>
            <div className="space-y-4 text-white/40 leading-relaxed">
              <p>En 2011, Andrés Castellanos y María Fernanda Oliva dejaron sus posiciones en BBVA Asset Management y una Big 4 respectivamente, frustrados por el mismo problema: el sistema financiero mexicano estaba diseñado para beneficiar a las instituciones, no a sus clientes.</p>
              <p>Fundaron Nexo Capital con la figura legal de Asesor en Inversiones regulado por la CNBV, lo que les impone la obligación fiduciaria de actuar siempre en el mejor interés del cliente. No es una promesa de marketing: es una obligación legal.</p>
              <p>Hoy administramos $3.2B MXN en activos para 620+ familias y empresas. Con rendimientos promedio anuales del 18.4% en los últimos 5 años, y el 78% de clientes que llevan más de 5 años con nosotros.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "2011", event: "Fundación como Asesor en Inversiones registrado ante CNBV" },
              { year: "2013", event: "Primer portafolio institucional: $50M MXN bajo gestión" },
              { year: "2016", event: "Lanzamiento del servicio de planeación financiera para familias" },
              { year: "2019", event: "Apertura de la práctica de finanzas corporativas" },
              { year: "2022", event: "Milestone: $1B MXN bajo asesoría" },
              { year: "2025", event: "Milestone: $3.2B MXN · 620+ clientes · 18.4% rendimiento promedio" },
            ].map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <span className="text-emerald-400 font-black text-sm w-12 shrink-0">{year}</span>
                <p className="text-white/40 text-sm leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-20 bg-gradient-to-b from-[#040f0a] to-[#060f0b]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros principios</h2>
            <p className="text-white/35">Los compromisos que nos diferencian del modelo tradicional.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-emerald-800/20 bg-emerald-950/10 hover:bg-emerald-950/15 transition-all">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-24 bg-[#040f0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">CFA, CFP y MBA con décadas de experiencia en banca, asset management y consultoría financiera.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-5">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-emerald-400/70 mb-0.5">{t.role}</p>
                  <p className="text-[11px] text-white/25 mb-3">{t.exp}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGULACIÓN */}
      <section className="py-20 bg-[#060f0b]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-6">Marco regulatorio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { org: "CNBV", desc: "Asesores en Inversiones · Clave 07-432-I · Supervisión continua" },
              { org: "AMIB", desc: "Asociación Mexicana de Instituciones Bursátiles · Miembro activo" },
              { org: "CFP Board", desc: "Certified Financial Planner™ · Certificación internacional" },
            ].map(r => (
              <div key={r.org} className="p-5 rounded-2xl border border-emerald-800/20 bg-emerald-950/10">
                <p className="text-emerald-400 font-black text-lg mb-2">{r.org}</p>
                <p className="text-xs text-white/35 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#040f0a]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Habla con uno de nuestros asesores</h2>
          <p className="text-white/35 mb-8">Diagnóstico inicial gratuito. Sin presión de venta. Solo análisis honesto.</p>
          <Link href="/webs/finanzas/contacto" className="px-8 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/30 inline-block">
            Agendar diagnóstico
          </Link>
        </div>
      </section>
    </div>
  )
}
