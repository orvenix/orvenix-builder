"use client"
import Link from "next/link"
import { brand, team, stats } from "../data/index"

export default function ViajesNosotros() {
  return (
    <div className="bg-[#08080f] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-800/25 text-orange-500 text-xs mb-6">La agencia</div>
          <h1 className="text-5xl font-black mb-6">Sobre {brand.name}</h1>
          <p className="text-xl text-white/40 leading-relaxed">
            Fundamos {brand.name} en {brand.founded} con una promesa: que viajar con asesoría profesional no debería costar más. Hoy, 14 años después, somos la agencia de confianza de más de 48,000 familias mexicanas.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-3xl font-black text-orange-400">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra historia</h2>
            <p className="text-white/40 leading-relaxed mb-4">
              Fernanda Castillo fundó Ruta Norte después de darse cuenta de que la mayoría de los viajeros mexicanos planeaban sus vacaciones solos, sin asesoría, y muchas veces con resultados decepcionantes.
            </p>
            <p className="text-white/40 leading-relaxed">
              Con el respaldo de la certificación IATA y un equipo que ha pisado cada destino que vende, construimos una agencia donde el viajero recibe el mismo nivel de atención que recibe un turista de primer mundo.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-black mb-5">Por qué elegirnos</h2>
            {[
              "Asesores que han viajado a los destinos que recomiendan",
              "Precios competitivos con hoteles y aerolíneas negociados directamente",
              "Seguro de viajero incluido en todos los paquetes internacionales",
              "Asistencia real 24/7 cuando algo sale mal en el destino",
              "Pago a 18 meses sin intereses con tarjetas participantes",
            ].map(item => (
              <div key={item} className="flex items-start gap-3 mb-3">
                <div className="w-5 h-5 rounded-full bg-orange-600/20 border border-orange-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
                <p className="text-sm text-white/40">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">Nuestros asesores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex gap-5 items-start">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-orange-400/70 mb-1">{t.role}</p>
                  <p className="text-xs text-white/30 mb-1">{t.specialty}</p>
                  <p className="text-[11px] text-white/20">{t.exp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-orange-900/20 bg-orange-950/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center text-lg">🏆</div>
            <h3 className="font-bold text-white">Certificación IATA {brand.iata}</h3>
          </div>
          <p className="text-sm text-white/40">La certificación IATA (International Air Transport Association) garantiza que nuestra agencia cumple con los más altos estándares internacionales en la gestión de boletos de avión, reservas y atención al viajero. No cualquier agencia la obtiene.</p>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Listo para conocer el mundo?</h2>
          <p className="text-white/35 mb-8">Consulta sin costo ni compromiso. Un asesor con experiencia real en el destino que te interesa te atiende hoy.</p>
          <Link href="/webs/viajes/contacto" className="px-10 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all">
            Hablar con un asesor →
          </Link>
        </div>
      </section>
    </div>
  )
}
