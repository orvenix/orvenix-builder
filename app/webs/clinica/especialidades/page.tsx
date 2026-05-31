"use client"
import Link from "next/link"
import { especialidades } from "../data/index"

export default function ClinicaEspecialidades() {
  return (
    <div className="min-h-screen bg-[#03100f]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-teal-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/20 border border-teal-700/25 text-teal-400 text-xs mb-6">8 especialidades médicas</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Especialidades</span>{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">médicas</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg">Médicos especialistas certificados con formación en los principales institutos nacionales e internacionales.</p>
        </div>
      </section>
      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {especialidades.map(e => {
            const Icon = e.icon
            return (
              <div key={e.name} className={`p-7 rounded-2xl border ${e.border} ${e.bg} hover:scale-[1.01] transition-all`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${e.bg} border ${e.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${e.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{e.name}</h2>
                  </div>
                </div>
                <p className="text-white/40 leading-relaxed mb-4">{e.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {e.tags.map(t => <span key={t} className={`px-2.5 py-0.5 text-[10px] rounded-full ${e.bg} ${e.color} border ${e.border}`}>{t}</span>)}
                </div>
                <Link href="/webs/clinica/contacto" className={`inline-flex items-center gap-1.5 text-xs font-bold ${e.color} hover:opacity-80 transition-opacity`}>
                  Agendar consulta →
                </Link>
              </div>
            )
          })}
        </div>
      </section>
      <section className="py-16 bg-gradient-to-b from-[#03100f] to-[#020c0b]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">¿No encuentras tu especialidad? Contáctanos y te orientamos.</p>
          <Link href="/webs/clinica/contacto" className="px-8 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/30 inline-block">
            Agendar cita
          </Link>
        </div>
      </section>
    </div>
  )
}
