"use client"
import Link from "next/link"
import { Scale, Info } from "lucide-react"
import { brand } from "../data/index"

const tarifas = [
  { tramite: "Escritura de compraventa (casa habitación)", base: "Aprox. 4–6% del valor fiscal", incluye: "Honorarios + ISAI + derechos RPC + gastos notariales", tiempo: "10–20 días hábiles", nota: "El ISAI lo paga el comprador" },
  { tramite: "Testamento público abierto", base: "$4,500 – $8,500", incluye: "Honorarios notariales + registro AGEN", tiempo: "El mismo día (cita previa)", nota: "Registro en AGEN sin costo adicional" },
  { tramite: "Poder notarial general", base: "$3,500 – $6,500", incluye: "Honorarios + copias certificadas", tiempo: "1 a 3 días hábiles", nota: "Apostilla adicional: $2,500" },
  { tramite: "Poder notarial especial", base: "$2,500 – $4,500", incluye: "Honorarios + copias certificadas", tiempo: "Mismo día o 1 día hábil", nota: "Apostilla disponible en 3 días" },
  { tramite: "Constitución SA de CV", base: "$8,500 – $15,000", incluye: "Honorarios + inscripción RPC + publicación DOF", tiempo: "5 a 10 días hábiles", nota: "Permiso SEMARNAT si aplica: adicional" },
  { tramite: "Fe de hechos / Certificación", base: "$2,000 – $5,000", incluye: "Honorarios notariales según extensión", tiempo: "Mismo día", nota: "Servicio a domicilio: cargo adicional" },
  { tramite: "Sucesión testamentaria", base: "Desde $12,000", incluye: "Honorarios + inscripción + adjudicación", tiempo: "30 a 90 días hábiles", nota: "Varía según complejidad del patrimonio" },
  { tramite: "Protocolización de acta", base: "$5,000 – $9,000", incluye: "Honorarios + copias certificadas", tiempo: "3 a 7 días hábiles", nota: "Puede requerir apostilla o ratificación" },
]

export default function NotariaTarifas() {
  return (
    <div className="bg-[#080a0e] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-yellow-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-6">Transparencia total</div>
          <h1 className="text-5xl font-black mb-6">Tarifas orientativas</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Los honorarios notariales están regulados por el Arancel del Notariado de la Ciudad de México. Los rangos mostrados son orientativos.</p>
        </div>
      </section>

      {/* AVISO LEGAL */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-900/20 bg-yellow-950/8">
          <Info className="w-5 h-5 text-yellow-600/60 shrink-0 mt-0.5" />
          <p className="text-sm text-white/40">Los costos definitivos dependen del valor del acto, la complejidad del trámite y los derechos de registro aplicables. Solicita un presupuesto sin costo antes de iniciar cualquier trámite. Los rangos incluyen honorarios notariales pero los impuestos (ISAI, ISR) son adicionales y los calcula el notario con base en el valor real del acto.</p>
        </div>
      </div>

      {/* TABLA DE TARIFAS */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="space-y-4">
          {tarifas.map(t => (
            <div key={t.tramite} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-all">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="md:flex-1">
                  <h3 className="font-bold text-white mb-1">{t.tramite}</h3>
                  <p className="text-xs text-white/30 mb-2">Incluye: {t.incluye}</p>
                  <p className="text-xs text-yellow-800/60 italic">{t.nota}</p>
                </div>
                <div className="md:text-right shrink-0">
                  <div className="text-lg font-black text-yellow-400">{t.base}</div>
                  <div className="text-xs text-white/30">Plazo: {t.tiempo}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO SE CALCULA */}
      <section className="py-16 bg-gradient-to-b from-[#080a0e] to-[#0b0d12]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-8">¿Cómo se calculan los honorarios?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: "Valor del acto", desc: "El Arancel establece tarifas basadas en el valor comercial o fiscal del inmueble o bien involucrado en el acto." },
              { title: "Complejidad jurídica", desc: "Trámites con múltiples partes, cláusulas especiales, poderes complejos o bienes mixtos tienen un costo mayor." },
              { title: "Gastos de registro", desc: "Los derechos del Registro Público, impuestos (ISAI, ISR) y gastos de la SRE se calculan por separado y se detallan en el presupuesto." },
            ].map(c => (
              <div key={c.title} className="p-5 rounded-2xl border border-yellow-900/20 bg-yellow-950/8">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-yellow-600/60" />
                  <h3 className="font-bold text-white text-sm">{c.title}</h3>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">Solicita tu presupuesto</h2>
          <p className="text-white/35 mb-3">Sin costo ni compromiso. El equipo del {brand.notario} te entrega el presupuesto detallado para tu trámite específico.</p>
          <p className="text-xs text-white/25 mb-8">Respondemos en menos de 24 horas hábiles.</p>
          <Link href="/webs/notaria/contacto" className="px-10 py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all">
            Solicitar presupuesto →
          </Link>
        </div>
      </section>
    </div>
  )
}
