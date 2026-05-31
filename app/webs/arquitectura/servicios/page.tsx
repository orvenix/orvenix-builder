"use client"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { services, process as workProcess } from "../data/index"

export default function ArquitecturaServicios() {
  return (
    <div className="bg-[#0a0908] min-h-screen">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-900/5 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-6">Especialidades</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Nuestros servicios</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto leading-relaxed">
            Seis áreas de especialidad con equipos dedicados. Cada proyecto tiene un arquitecto responsable con experiencia comprobada en ese tipo de obra.
          </p>
        </div>
      </section>

      {/* SERVICIOS DETALLADOS */}
      <section className="pb-20 max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {services.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.id} className={`p-8 rounded-3xl border ${s.border} ${s.bg}`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center mb-5`}>
                      <Icon className={`w-7 h-7 ${s.color}`} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">{s.title}</h2>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <div className={`text-lg font-black ${s.color}`}>{s.proyectos.split(" ")[0]}</div>
                        <div className="text-white/25 text-xs">proyectos</div>
                      </div>
                      <div>
                        <div className={`text-lg font-black ${s.color}`}>{s.satisfaccion.split("%")[0]}%</div>
                        <div className="text-white/25 text-xs">satisfacción</div>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-white/45 leading-relaxed mb-6 text-base">{s.desc}</p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {s.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 text-sm text-white/40">
                          <CheckCircle className={`w-4 h-4 ${s.color} shrink-0`} />
                          {tag}
                        </div>
                      ))}
                    </div>
                    <Link href="/webs/arquitectura/contacto" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border ${s.border} ${s.color} hover:${s.bg} transition-all`}>
                      Solicitar cotización <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-20 bg-gradient-to-b from-[#0a0908] to-[#0d0b09]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">Proceso de trabajo</h2>
            <p className="text-white/35">Transparencia y comunicación en cada etapa del proyecto.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workProcess.map(p => (
              <div key={p.n} className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015]">
                <div className="text-2xl font-black text-amber-900/50 w-10 shrink-0">{p.n}</div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-black mb-4">¿Qué proyecto tienes en mente?</h2>
        <p className="text-white/35 mb-8">La primera consulta es gratuita. Cuéntanos el predio, el uso y el presupuesto aproximado.</p>
        <Link href="/webs/arquitectura/contacto" className="px-10 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30">
          Agendar consulta gratuita →
        </Link>
      </section>
    </div>
  )
}
