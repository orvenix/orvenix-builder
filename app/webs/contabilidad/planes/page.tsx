"use client"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { planes, faqs } from "../data/index"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function ContabilidadPlanes() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="bg-[#070f14] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-teal-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/20 border border-teal-800/25 text-teal-500 text-xs mb-6">Precios transparentes</div>
          <h1 className="text-5xl font-black mb-6">Planes y precios</h1>
          <p className="text-xl text-white/35 max-w-xl mx-auto">Sin letra pequeña. Sin cobros extras por declaraciones o consultas incluidas en tu plan.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {planes.map(plan => (
            <div key={plan.name} className={`p-8 rounded-3xl border transition-all relative ${plan.highlight ? "border-teal-600/50 bg-teal-950/20 ring-1 ring-teal-600/20" : "border-white/[0.07] bg-white/[0.02]"}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-bold rounded-full bg-teal-600 text-white">Más popular</span>
                </div>
              )}
              <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-white/35 mb-6">{plan.desc}</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-teal-400">{plan.price}</span>
                <span className="text-sm text-white/30">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/45">
                    <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/webs/contabilidad/contacto" className={`block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all ${plan.highlight ? "bg-teal-600 hover:bg-teal-500 text-white" : "border border-white/15 text-white/55 hover:text-white hover:border-white/30"}`}>
                {plan.highlight ? "Comenzar ahora →" : "Solicitar información →"}
              </Link>
            </div>
          ))}
        </div>

        {/* COMPARATIVA */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] mb-16">
          <h3 className="font-black text-white text-lg mb-2">¿Qué plan necesito?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { plan: "Starter", para: "Persona física, freelancer, microempresa", facturacion: "Hasta $2M anuales", empleados: "Sin empleados o 1-5" },
              { plan: "Business", para: "PYME en crecimiento, hasta 30 empleados", facturacion: "$2M – $20M anuales", empleados: "6 a 30 empleados" },
              { plan: "Enterprise", para: "Corporativo, grupos de empresas", facturacion: "Más de $20M anuales", empleados: "+30 empleados" },
            ].map(r => (
              <div key={r.plan} className="p-4 rounded-xl border border-teal-900/30 bg-teal-950/8">
                <h4 className={`font-bold text-teal-400 mb-2`}>{r.plan}</h4>
                <p className="text-xs text-white/40 mb-1"><span className="text-white/25">Para: </span>{r.para}</p>
                <p className="text-xs text-white/40 mb-1"><span className="text-white/25">Facturación: </span>{r.facturacion}</p>
                <p className="text-xs text-white/40"><span className="text-white/25">Empleados: </span>{r.empleados}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-3xl font-black text-center mb-8">Preguntas sobre precios</h2>
        <div className="space-y-3">
          {faqs.slice(0, 4).map((faq, i) => (
            <div key={i} className="border border-white/[0.05] rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-teal-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
