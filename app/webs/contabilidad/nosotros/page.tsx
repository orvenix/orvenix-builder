"use client"
import Link from "next/link"
import { brand, team, stats } from "../data/index"

const valores = [
  { title: "Cero tolerancia a las multas", desc: "Nuestra promesa a cada cliente es presentar declaraciones en tiempo. Nuestro sistema de alertas opera 30 días antes de cada vencimiento." },
  { title: "Transparencia total", desc: "Portal digital donde puedes ver en tiempo real el avance de tu contabilidad, declaraciones presentadas y próximas fechas límite." },
  { title: "Contador asignado personal", desc: "No somos un call center. Tienes un C.P. asignado que conoce tu caso y responde en menos de 48 horas a cualquier consulta incluida en tu plan." },
  { title: "Planeación proactiva", desc: "No esperamos a que el SAT te notifique. Revisamos tu situación trimestralmente y alertamos sobre oportunidades de optimización fiscal." },
]

export default function ContabilidadNosotros() {
  return (
    <div className="bg-[#070f14] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-teal-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/20 border border-teal-800/25 text-teal-500 text-xs mb-6">El despacho</div>
          <h1 className="text-5xl font-black mb-6">Sobre {brand.name}</h1>
          <p className="text-xl text-white/40 leading-relaxed">
            Fundado en {brand.founded}, {brand.name} nació con la misión de llevar la calidad contable de los grandes despachos a las PYMES mexicanas. Hoy somos el despacho de confianza de 850+ empresas.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-3xl font-black text-teal-400">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra misión</h2>
            <p className="text-white/40 leading-relaxed mb-4">Creemos que una PYME bien asesorada fiscalmente crece más rápido, toma mejores decisiones y se protege de contingencias. Por eso democratizamos el acceso a contaduría de primer nivel.</p>
            <p className="text-white/40 leading-relaxed">Somos miembros activos del IMCP (Instituto Mexicano de Contadores Públicos) y actualizamos constantemente nuestros procesos ante cada reforma fiscal del SAT.</p>
          </div>
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra diferencia</h2>
            <p className="text-white/40 leading-relaxed mb-4">A diferencia de la mayoría de despachos, usamos tecnología para automatizar lo repetitivo y dedicar el tiempo de nuestros contadores a lo que realmente importa: la estrategia fiscal de cada cliente.</p>
            <p className="text-white/40 leading-relaxed">Nuestra plataforma digital es propia. Conecta directamente con el SAT, genera alertas automáticas y entrega reportes ejecutivos cada mes.</p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">Nuestros compromisos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {valores.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-teal-900/20 bg-teal-950/8">
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">El equipo directivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex gap-5 items-start">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-teal-400/70 mb-1">{t.role}</p>
                  <p className="text-xs text-white/30 mb-1">{t.specialty}</p>
                  <p className="text-[11px] text-white/20">{t.exp}</p>
                  <p className="text-[10px] text-teal-800/50 mt-1">{t.cedula}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center bg-gradient-to-b from-[#070f14] to-[#050c10]">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Listo para estar al corriente?</h2>
          <p className="text-white/35 mb-8">Diagnóstico fiscal gratuito. Sin compromiso. Conoce el estado real de tu situación en 48 horas.</p>
          <Link href="/webs/contabilidad/contacto" className="px-10 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all">
            Solicitar diagnóstico →
          </Link>
        </div>
      </section>
    </div>
  )
}
