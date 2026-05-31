"use client"
import Link from "next/link"
import { chef, team, services } from "../data/index"

export default function RestauranteNosotros() {
  return (
    <div className="min-h-screen bg-[#120b04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-amber-900/8 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">Nuestra historia</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">El alma detrás de</span>
            <br /><span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent italic">Bella Terra</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Una historia de familia, pasión por los ingredientes honestos y la convicción de que la mejor mesa es la que reúne a las personas que amas.
          </p>
        </div>
      </section>

      {/* Chef section */}
      <section className="pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-700 to-orange-900 flex items-center justify-center text-3xl font-black text-white mb-6">{chef.avatar}</div>
            <h2 className="text-3xl font-black text-white mb-1">{chef.name}</h2>
            <p className="text-amber-400 text-sm mb-5">{chef.title}</p>
            <p className="text-white/40 leading-relaxed mb-6">{chef.bio}</p>
            <div>
              <p className="text-xs font-bold text-amber-600/60 uppercase tracking-wider mb-3">Reconocimientos</p>
              <div className="space-y-2">
                {chef.awards.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-white/50">
                    <span className="text-amber-500">★</span> {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "2002", event: "Graduación del Culinary Institute of America, New York" },
              { year: "2005", event: "Stage en El Bulli, Roses, España · Con Ferran Adrià" },
              { year: "2009", event: "Chef de cuisine en Osteria Francescana, Módena" },
              { year: "2012", event: "Retorno a México · Primer concepto gastronómico propio" },
              { year: "2014", event: "Apertura de Bella Terra en Polanco, CDMX" },
              { year: "2022", event: "Primer reconocimiento Gault&Millau · 3 toques" },
              { year: "2024", event: "Tres años consecutivos con máxima distinción Gault&Millau" },
            ].map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <span className="text-amber-400 font-black text-sm w-12 shrink-0">{year}</span>
                <p className="text-white/40 text-sm leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-20 bg-gradient-to-b from-[#120b04] to-[#0e0803]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-10 text-center">El equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10 text-center hover:bg-amber-950/15 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-orange-900 flex items-center justify-center text-xl font-black text-white mx-auto mb-4">{t.avatar}</div>
                <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                <p className="text-xs text-amber-400/70 mb-0.5">{t.role}</p>
                <p className="text-[11px] text-white/25 mb-2">{t.specialty}</p>
                <p className="text-[10px] text-white/20">{t.exp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-20 bg-[#0a0502]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-10 text-center">Nuestros espacios y experiencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map(s => {
              const Icon = s.icon
              return (
                <div key={s.name} className={`p-6 rounded-2xl border ${s.border} ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color} mb-3`} />
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map(t => <span key={t} className={`px-2 py-0.5 text-[10px] rounded-full ${s.bg} ${s.color} border ${s.border}`}>{t}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0a0502]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6 italic">Ven a conocer nuestra historia en persona</p>
          <Link href="/webs/restaurante/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Reservar mesa
          </Link>
        </div>
      </section>
    </div>
  )
}
