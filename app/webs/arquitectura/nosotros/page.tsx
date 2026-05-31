"use client"
import Link from "next/link"
import { brand, team, stats } from "../data/index"

const valores = [
  { title: "Diseño centrado en el habitar", desc: "Partimos del ser humano: cómo vive, trabaja y se mueve en el espacio. El estilo es consecuencia, no punto de partida." },
  { title: "Materialidad honesta", desc: "Usamos materiales que envejecen bien y son honestos con su función. Evitamos el uso cosmético de lo que no es estructural." },
  { title: "Sustentabilidad sin compromiso", desc: "Integramos criterios de eficiencia energética y captación de agua desde el diseño inicial, no como añadido posterior." },
  { title: "Compromiso con los plazos", desc: "El 94% de nuestros proyectos se entrega en la fecha acordada. Reportes semanales fotográficos para todos los clientes." },
]

const hitos = [
  { year: brand.founded, evento: "Fundación de Espacio Studio por el Arq. Carlos Vega" },
  { year: "2012", evento: "Primer proyecto comercial corporativo: Torre Insurgentes 480" },
  { year: "2015", evento: "Primer premio ARQUINE — Categoría Residencial Sustentable" },
  { year: "2018", evento: "Apertura del departamento de interiorismo y paisajismo" },
  { year: "2021", evento: "100 proyectos entregados. Premio MCHAP Mention" },
  { year: "2023", evento: "Premio ARQUINE Hotel Boutique Tepoztlán" },
  { year: "2024", evento: "Certificación como firma LEED Accredited Partner" },
]

export default function ArquitecturaNosotros() {
  return (
    <div className="bg-[#0a0908] min-h-screen">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-900/4 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-6">El estudio</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Sobre {brand.name}</h1>
          <p className="text-xl text-white/40 leading-relaxed max-w-3xl">
            Fundamos {brand.name} en {brand.founded} con una convicción: que la arquitectura de calidad no debería ser un lujo reservado solo a los pocos. Hoy, {new Date().getFullYear() - parseInt(brand.founded)} años después, ese principio guía cada proyecto que firmamos.
          </p>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra historia</h2>
            <p className="text-white/40 leading-relaxed mb-4">
              El Arq. Carlos Vega fundó el estudio tras regresar de su maestría en el ETSAB de Barcelona, con la certeza de que la arquitectura contemporánea mexicana tenía algo único que decir al mundo: la capacidad de integrar lo vernáculo con lo contemporáneo sin caer en la nostalgia ni en el internacionalismo frío.
            </p>
            <p className="text-white/40 leading-relaxed">
              Comenzamos con proyectos residenciales en la Ciudad de México. Hoy operamos en todo el país y hemos recibido reconocimientos en el ARQUINE, el MCHAP y el Premio Nacional de Arquitectura.
            </p>
          </div>
          <div className="space-y-3">
            {hitos.map(h => (
              <div key={h.year} className="flex gap-4 items-start">
                <div className="text-xs font-bold text-amber-700/60 w-10 shrink-0 pt-0.5">{h.year}</div>
                <div className="flex-1 pl-4 border-l border-white/[0.06] pb-3">
                  <p className="text-sm text-white/45">{h.evento}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-16 bg-gradient-to-b from-[#0a0908] to-[#0d0b09]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-10 text-center">Nuestros valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {valores.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-black mb-10 text-center">En números</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-3xl font-black text-amber-400">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-16 bg-[#0d0b09]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-10 text-center">El equipo directivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex gap-5 items-start">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-amber-400/70 mb-1">{t.role}</p>
                  <p className="text-xs text-white/30 mb-1">{t.specialty}</p>
                  <p className="text-[11px] text-white/20">{t.exp}</p>
                  <p className="text-[10px] text-amber-800/50 mt-1">{t.cedula}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Listo para trabajar juntos?</h2>
          <p className="text-white/35 mb-8">Primera consulta sin costo. Agendamos la visita al predio en menos de 24 horas.</p>
          <Link href="/webs/arquitectura/contacto" className="px-10 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all">
            Iniciar proyecto →
          </Link>
        </div>
      </section>
    </div>
  )
}
