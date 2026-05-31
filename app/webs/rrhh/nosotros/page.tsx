"use client"
import Link from "next/link"
import { brand, team, stats } from "../data/index"

const valores = [
  { title: "Resultados medibles, no promesas", desc: "Antes de iniciar cualquier proyecto definimos métricas base. Al final, mostramos el delta real. Sin storytelling, solo números." },
  { title: "Transferencia de conocimiento", desc: "No creamos dependencia. Capacitamos a tu área de RRHH para que opere autónomamente los procesos que implementamos." },
  { title: "Confidencialidad absoluta", desc: "Manejamos información sensible sobre personas y estructuras organizacionales. Nuestros acuerdos de confidencialidad son estrictos y vinculantes." },
  { title: "Especialización sectorial", desc: "No somos generalistas. Tenemos prácticas especializadas en tecnología, manufactura, retail, salud y banca. El contexto importa." },
]

export default function RRHHNosotros() {
  return (
    <div className="bg-[#090714] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-violet-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/25 text-violet-500 text-xs mb-6">La consultora</div>
          <h1 className="text-5xl font-black mb-6">Sobre {brand.name}</h1>
          <p className="text-xl text-white/40 leading-relaxed">
            Fundamos {brand.name} en {brand.founded} con la convicción de que el talento es la única ventaja competitiva sostenible. En {new Date().getFullYear() - parseInt(brand.founded)} años, hemos acompañado a más de 320 empresas en esa transformación.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-3xl font-black text-violet-400">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra historia</h2>
            <p className="text-white/40 leading-relaxed mb-4">
              La Mtra. Claudia Mendoza fundó {brand.name} después de 8 años liderando RRHH en Grupo Televisa, donde aprendió que las mejores empresas del mundo son las que priorizan el talento de manera sistemática, no reactiva.
            </p>
            <p className="text-white/40 leading-relaxed">
              Construimos un equipo con experiencia en firmas globales como Michael Page y PwC, certificaciones internacionales (SHRM, ICF) y sobre todo, con resultados probados en el mercado mexicano.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-black mb-5">Nuestra diferencia</h2>
            <p className="text-white/40 leading-relaxed mb-4">La mayoría de las consultoras de RRHH venden metodologías genéricas. Nosotros diseñamos soluciones específicas para cada empresa, su industria, su cultura y su momento de negocio.</p>
            <p className="text-white/40 leading-relaxed">No terminamos el proyecto al entregar el informe. Acompañamos la implementación, medimos los resultados y hacemos ajuste durante el primer año.</p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">Nuestros principios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {valores.map(v => (
              <div key={v.title} className="p-6 rounded-2xl border border-violet-900/20 bg-violet-950/8">
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">El equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex gap-5 items-start">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-violet-400/70 mb-1">{t.role}</p>
                  <p className="text-xs text-white/30 mb-1">{t.specialty}</p>
                  <p className="text-[11px] text-white/20">{t.exp}</p>
                  <p className="text-[10px] text-violet-800/50 mt-1">{t.cedula}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-violet-900/20 bg-violet-950/8">
          <h3 className="font-bold text-white mb-3">Certificaciones del equipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["SHRM-SCP", "ICF PCC Coach", "DISC Certified Trainer", "Certificado STPS", "LinkedIn Recruiter", "Assessment DISC", "Gartner HR Analytics", "NOM-035 Especialistas"].map(c => (
              <div key={c} className="px-3 py-2 rounded-lg border border-violet-900/30 text-xs text-violet-400/70 text-center">{c}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Empezamos juntos?</h2>
          <p className="text-white/35 mb-8">Diagnóstico gratuito. Sin compromiso. Conoce en 48h qué está frenando el crecimiento de tu organización.</p>
          <Link href="/webs/rrhh/contacto" className="px-10 py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all">
            Solicitar diagnóstico →
          </Link>
        </div>
      </section>
    </div>
  )
}
