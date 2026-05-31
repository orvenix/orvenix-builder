"use client"
import Link from "next/link"
import { brand, equipo, stats } from "../data/index"

const hitos = [
  { year: brand.founded, evento: `Apertura de la Notaría Pública No. 88 por el ${brand.notario}` },
  { year: "1995", evento: "Primera escrituración de conjunto habitacional de más de 200 unidades" },
  { year: "2002", evento: "Incorporación de Valeria Romero al despacho como abogada asociada" },
  { year: "2008", evento: "Implementación de expediente digital y firma electrónica notarial" },
  { year: "2014", evento: "50,000 instrumentos protocolizados en el libro de protocolo" },
  { year: "2019", evento: "Reconocimiento del Colegio de Notarios CDMX por trayectoria" },
  { year: "2024", evento: "120,000 instrumentos firmados y apertura de atención virtual parcial" },
]

export default function NotariaNosotros() {
  return (
    <div className="bg-[#080a0e] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-yellow-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-6">La Notaría</div>
          <h1 className="text-5xl font-black mb-6">{brand.name} {brand.numero}</h1>
          <p className="text-xl text-white/40 leading-relaxed">
            {new Date().getFullYear() - parseInt(brand.founded)} años de ejercicio notarial en la Ciudad de México. Una trayectoria construida sobre la honestidad, el rigor jurídico y el servicio cercano a cada cliente.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-3xl font-black text-yellow-400">{s.value}</div>
              <div className="text-xs text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-black mb-5">Historia de la Notaría</h2>
            <p className="text-white/40 leading-relaxed mb-4">
              El {brand.notario} recibió el Notariado No. 88 de la Ciudad de México en {brand.founded}, tras una trayectoria de litigio civil y corporativo en los principales despachos de la capital.
            </p>
            <p className="text-white/40 leading-relaxed mb-4">
              Desde entonces, la Notaría ha protocolizado más de 120,000 instrumentos: escrituras de compraventa, testamentos, poderes, sociedades mercantiles, actas y sucesiones. Cada uno con la misma atención que el primero.
            </p>
            <p className="text-white/40 leading-relaxed">
              Miembro del {brand.colegiado} y con protocolo debidamente autonorizado y actualizado, la Notaría opera con los más altos estándares de la fe pública notarial mexicana.
            </p>
          </div>
          <div className="space-y-3">
            {hitos.map(h => (
              <div key={h.year} className="flex gap-4 items-start">
                <div className="text-xs font-bold text-yellow-700/60 w-10 shrink-0 pt-0.5">{h.year}</div>
                <div className="flex-1 pl-4 border-l border-white/[0.06] pb-3">
                  <p className="text-sm text-white/40">{h.evento}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-black mb-8 text-center">El equipo jurídico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {equipo.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex gap-5 items-start">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl font-black text-white shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5">{t.name}</h3>
                  <p className="text-xs text-yellow-500/70 mb-1">{t.role}</p>
                  <p className="text-xs text-white/30 mb-1">{t.specialty}</p>
                  <p className="text-[11px] text-white/20">{t.exp}</p>
                  <p className="text-[10px] text-yellow-800/50 mt-1">{t.cedula}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-yellow-900/20 bg-yellow-950/8">
          <h3 className="font-bold text-white mb-3">Acreditaciones y membresías</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[brand.colegiado, brand.protocolo, "Archivo General de Notarías CDMX", "Registro Público de la Propiedad y Comercio CDMX"].map(a => (
              <div key={a} className="flex items-center gap-2 text-sm text-white/40">
                <div className="w-2 h-2 rounded-full bg-yellow-700/60" />
                {a}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Necesitas un trámite notarial?</h2>
          <p className="text-white/35 mb-8">Agenda tu cita. Te orientamos sin costo en el trámite que necesitas y te entregamos un presupuesto transparente.</p>
          <Link href="/webs/notaria/contacto" className="px-10 py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all">
            Solicitar cita →
          </Link>
        </div>
      </section>
    </div>
  )
}
