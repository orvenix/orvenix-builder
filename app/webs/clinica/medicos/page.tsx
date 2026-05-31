"use client"
import Link from "next/link"
import { medicos, seguros } from "../data/index"

export default function ClinicaMedicos() {
  return (
    <div className="min-h-screen bg-[#03100f]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-teal-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/20 border border-teal-700/25 text-teal-400 text-xs mb-6">Equipo médico certificado</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestros</span>{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">médicos</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Especialistas con cédula profesional verificada, formación en institutos nacionales y certificación vigente por sus respectivos consejos.</p>
        </div>
      </section>

      <section className="pb-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {medicos.map(m => (
            <div key={m.name} className="p-6 rounded-2xl border border-teal-800/25 bg-teal-950/10 hover:bg-teal-950/15 transition-all">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl font-black text-white mb-4`}>{m.avatar}</div>
              <h3 className="font-bold text-white mb-0.5">{m.name}</h3>
              <p className="text-xs text-teal-400/80 mb-1">{m.specialty}</p>
              <p className="text-[11px] text-white/30 mb-1">{m.exp}</p>
              <p className="text-[10px] text-white/20 mb-3">{m.cedula}</p>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                <span className="text-[11px] text-white/30">Atiende: {m.disponible}</span>
                <Link href="/webs/clinica/contacto" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">Agendar →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seguros */}
      <section className="py-20 bg-[#020c0b]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Seguros aceptados</h2>
          <p className="text-white/35 mb-10">Verificamos tu cobertura antes de la consulta sin costo adicional.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {seguros.map(s => (
              <span key={s} className="px-4 py-2 rounded-xl border border-teal-800/25 bg-teal-950/10 text-teal-400/70 text-sm font-semibold">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#020c0b]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">¿Listo para agendar tu consulta?</p>
          <Link href="/webs/clinica/contacto" className="px-8 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/30 inline-block">
            Agendar cita en línea
          </Link>
        </div>
      </section>
    </div>
  )
}
