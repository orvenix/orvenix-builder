"use client"
import Link from "next/link"
import { brand, team, values, awards } from "../data/index"

export default function AbogadosNosotros() {
  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-amber-900/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            Quiénes somos
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">El despacho</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">detrás de tu defensa</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Fundado en {brand.founded}, {brand.name} {brand.sub} nació con una misión clara: hacer accesible el derecho de calidad a personas y empresas que necesitan resultados reales, no promesas vacías.
          </p>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Nuestra historia</h2>
            <div className="space-y-4 text-white/40 leading-relaxed">
              <p>En 2007, el Lic. Carlos Montes de Oca dejó su puesto como director jurídico en la SHCP para fundar un despacho diferente: uno donde los clientes siempre supieran qué estaba pasando con su caso, y donde los honorarios fueran transparentes desde el primer día.</p>
              <p>Lo que empezó como un despacho unipersonal en Reforma creció hasta convertirse en un equipo de 6 abogados especializados, con más de 2,320 casos resueltos en 18 años de operación ininterrumpida.</p>
              <p>Hoy somos miembros de ANADE, de la Barra de Abogados de la Ciudad de México y contamos con reconocimientos de Chambers Latin America y Legal 500 México. Pero lo que más nos enorgullece son las 4,800 personas y empresas que confiaron en nosotros.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "2007", event: "Fundación del despacho en Paseo de la Reforma" },
              { year: "2012", event: "Apertura de la práctica penal especializada" },
              { year: "2016", event: "Reconocimiento Legal 500 México como Despacho Boutique" },
              { year: "2019", event: "Expansión a Guadalajara y Monterrey" },
              { year: "2023", event: "Top 10 Firmas Laborales · Chambers Latin America" },
              { year: "2024", event: "Despacho del Año · ANADE" },
            ].map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <span className="text-amber-400 font-black text-sm w-12 shrink-0">{year}</span>
                <p className="text-white/40 text-sm leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-20 bg-gradient-to-b from-[#070b14] to-[#090d18]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros valores</h2>
            <p className="text-white/35">Los principios que guían cada caso que tomamos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10 hover:bg-amber-950/15 transition-all">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-24 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo</h2>
            <p className="text-white/35">Abogados certificados con trayectoria comprobable y cédula profesional verificable ante la SEP.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white text-center mb-1">{t.name}</h3>
                <p className="text-xs text-amber-400/70 text-center mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 text-center mb-2">{t.specialty}</p>
                <p className="text-[11px] text-white/20 text-center mb-4">{t.exp}</p>
                <p className="text-xs text-white/30 leading-relaxed text-center">{t.bio}</p>
                <div className="mt-4 pt-4 border-t border-white/5 text-center">
                  <span className="text-[11px] text-amber-800/60">{t.cedula}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECONOCIMIENTOS */}
      <section className="py-20 bg-[#090d18]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">Reconocimientos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {awards.map(a => (
              <div key={a.title} className="flex items-start gap-4 p-5 rounded-2xl border border-amber-800/20 bg-amber-950/10">
                <span className="text-amber-400 font-black text-lg shrink-0">{a.year}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{a.title}</h3>
                  <p className="text-xs text-white/30 mt-0.5">{a.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#070b14]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Trabajemos juntos</h2>
          <p className="text-white/35 mb-8">Conoce a nuestro equipo en persona. La primera consulta es gratuita y sin compromiso.</p>
          <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Agendar reunión
          </Link>
        </div>
      </section>
    </div>
  )
}
