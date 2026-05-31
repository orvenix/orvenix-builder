"use client"
import Link from "next/link"
import { brand, team, equipment } from "../data/index"

export default function FotografiaNosotros() {
  return (
    <div className="min-h-screen bg-[#080708]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-yellow-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-400 text-xs mb-6">Quiénes somos</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Artistas detrás</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">del lente</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Fundado en {brand.founded}, {brand.name} nació con una convicción: la fotografía profesional debe ser accesible, auténtica y artística — no genérica ni formulaica.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Nuestra historia</h2>
            <div className="space-y-4 text-white/40 leading-relaxed">
              <p>Marco Álvarez fundó {brand.name} en {brand.founded} tras años trabajando en fotografía editorial para publicaciones internacionales. La motivación fue simple: quería llevar esa misma calidad y visión artística a bodas, retratos y marcas que merecían más que fotógrafos genéricos.</p>
              <p>Hoy somos un equipo de cuatro artistas visuales especializados, con más de 1,800 sesiones documentadas en toda la República Mexicana y en destinos internacionales. Cada proyecto lo abordamos como si fuera el primero.</p>
              <p>Somos Canon Explorer of Light y Sony Ambassador en México, lo que nos da acceso anticipado a la mejor tecnología disponible y nos mantiene en constante evolución técnica y creativa.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: brand.founded, event: "Fundación en CDMX · Primeras bodas y sesiones editoriales" },
              { year: "2018", event: "Apertura del estudio en Condesa con set completo de iluminación" },
              { year: "2019", event: "Incorporación de videografía cinematic y drone certificado" },
              { year: "2021", event: "Canon Explorer of Light · Milestone: 1,000 sesiones" },
              { year: "2023", event: "Sony Ambassador México · Expansión a LATAM" },
              { year: "2025", event: "Milestone: 1,800 sesiones · Equipo completo de 4 artistas" },
            ].map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <span className="text-yellow-400 font-black text-sm w-12 shrink-0">{year}</span>
                <p className="text-white/40 text-sm leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-24 bg-gradient-to-b from-[#080708] to-[#0b090a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">Cuatro artistas visuales con especialidades complementarias.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-5">
                <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white shrink-0 w-20 h-20`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-yellow-400/70 mb-0.5">{t.role}</p>
                  <p className="text-[11px] text-white/25 mb-3">{t.exp}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo técnico */}
      <section className="py-20 bg-[#0b090a]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Equipo técnico</h2>
            <p className="text-white/35">Utilizamos el mejor equipo disponible. No porque sea caro, sino porque hace diferencia en cada toma.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {equipment.map(e => (
              <div key={e.brand} className="p-4 rounded-2xl border border-yellow-800/20 bg-yellow-950/10 text-center">
                <p className="font-black text-yellow-400 mb-1">{e.brand}</p>
                <p className="text-xs text-white/50 font-medium">{e.model}</p>
                <p className="text-[10px] text-white/25 mt-1">{e.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#080708]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Trabajemos juntos</h2>
          <p className="text-white/35 mb-8">Cuéntanos tu proyecto. Revisamos disponibilidad y te enviamos propuesta en 24 horas.</p>
          <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30 inline-block">
            Agendar consulta
          </Link>
        </div>
      </section>
    </div>
  )
}
