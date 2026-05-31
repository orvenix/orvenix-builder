"use client"
import Link from "next/link"
import { brand, team, values } from "../data/index"

export default function SegurosNosotros() {
  return (
    <div className="min-h-screen bg-[#06090f]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-blue-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700/25 text-blue-400 text-xs mb-6">
            Quiénes somos
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Trabajamos</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">para ti, no para ellas</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Fundada en {brand.founded}, {brand.name} es una correduría independiente. Eso significa que no tenemos acuerdos de exclusividad con ninguna aseguradora. Nuestra única lealtad es hacia el cliente.
          </p>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6">Nuestra historia</h2>
            <div className="space-y-4 text-white/40 leading-relaxed">
              <p>Fernando Ríos pasó 8 años trabajando como director regional en una aseguradora importante. En ese tiempo vio cómo los agentes captivos recomendaban los productos con mayor comisión, no los que más convenían al cliente. En 2009, decidió cambiar ese modelo.</p>
              <p>Fundó Fortuna Corredores de Seguros con un principio simple: el asesor que te recomienda un seguro debe ser completamente independiente. Desde entonces, hemos crecido hasta ser un equipo de 4 especialistas que administra más de 12,400 pólizas en todo México.</p>
              <p>Hoy somos Corredor autorizado por la CNSF, miembros activos de la AMIS y contamos con agentes especializados por producto. Porque creemos que los seguros son demasiado importantes como para ser cosa de un generalista.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "2009", event: "Fundación · Primer corredor independiente en el equipo" },
              { year: "2012", event: "Apertura de la especialidad en GMM colectivo para empresas" },
              { year: "2015", event: "CNSF Clave 18-642-I · Autorización plena como corredor" },
              { year: "2018", event: "Milestone: 5,000 pólizas bajo administración" },
              { year: "2021", event: "Expansión a seguros de retiro y ahorro con beneficio fiscal" },
              { year: "2024", event: "Milestone: 12,400 pólizas · $0 reclamaciones negadas injustamente" },
            ].map(({ year, event }) => (
              <div key={year} className="flex gap-4 items-start">
                <span className="text-blue-400 font-black text-sm w-12 shrink-0">{year}</span>
                <p className="text-white/40 text-sm leading-relaxed">{event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-20 bg-gradient-to-b from-[#06090f] to-[#080c14]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros compromisos</h2>
            <p className="text-white/35">Los principios que nos diferencian de un agente cautivo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-blue-800/20 bg-blue-950/10 hover:bg-blue-950/15 transition-all">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-24 bg-[#06090f]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros especialistas</h2>
            <p className="text-white/35">Cada agente se especializa en uno o dos tipos de seguro. No somos generalistas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-blue-400/70 mb-0.5">{t.role}</p>
                  <p className="text-[11px] text-white/25 mb-2">{t.exp}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ASEGURADORAS */}
      <section className="py-20 bg-[#080c14]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Trabajamos con las mejores</h2>
          <p className="text-white/35 mb-10">Convenio directo con más de 12 aseguradoras. Sin preferencias: comparamos y recomendamos la mejor opción para tu caso.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["GNP", "MetLife", "AXA", "Zurich", "HDI", "Qualitas", "Mapfre", "Allianz", "BUPA", "Seguros Atlas", "Seguros Monterrey", "Chubb"].map(a => (
              <span key={a} className="px-4 py-2 rounded-xl border border-blue-800/25 text-blue-400/70 text-sm bg-blue-950/10">{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#06090f]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Habla con un especialista hoy</h2>
          <p className="text-white/35 mb-8">Sin compromiso. Te asesoramos y, si ya tienes buenos seguros, te lo decimos honestamente.</p>
          <Link href="/webs/seguros/contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30 inline-block">
            Cotizar gratis
          </Link>
        </div>
      </section>
    </div>
  )
}
