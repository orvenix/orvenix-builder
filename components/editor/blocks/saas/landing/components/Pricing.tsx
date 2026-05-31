"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Zap, ArrowRight } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { plans } from "../data/pricing"

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="py-32 bg-[#06060e] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 mb-6">
            Precios transparentes · Sin sorpresas
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Elige tu plan ideal
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
            Escala cuando lo necesites. Cancela cuando quieras. Sin compromisos a largo plazo.
          </p>

          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? "bg-white text-slate-900" : "text-white/40 hover:text-white/70"}`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-white text-slate-900" : "text-white/40 hover:text-white/70"}`}
            >
              Anual
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {plans.map((plan) => {
            const c = colorStyles[plan.colorKey]
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all border ${
                  plan.popular
                    ? `border-2 bg-white/4 shadow-2xl ${c.border}`
                    : "border-white/8 bg-white/2"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${c.bgSolid}`}>
                      <Zap className="w-3 h-3" />
                      Más popular
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-white/30 text-sm mb-1.5">/mes</span>
                  </div>
                  {annual && (
                    <div className="text-xs text-white/30 mt-0.5">
                      Facturado anualmente · ${plan.yearlyPrice * 12}/año
                    </div>
                  )}
                </div>

                <Link
                  href={plan.id === "enterprise" ? "/contacto" : "/register"}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-6 text-white text-center block ${
                    plan.popular
                      ? `${c.bgSolid} hover:opacity-90 shadow-lg`
                      : "bg-white/7 hover:bg-white/12 border border-white/10"
                  }`}
                >
                  Empezar con {plan.name}
                </Link>

                <div className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-sm text-white/60">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
                        <Check className={`w-2.5 h-2.5 ${c.text}`} />
                      </div>
                      {feat}
                    </div>
                  ))}
                  {plan.missing.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-sm text-white/20">
                      <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 p-6 rounded-2xl border border-white/7 bg-white/2 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">¿Necesitas un plan personalizado?</h3>
            <p className="text-sm text-white/40">Para volúmenes extremos, compliance específico o infraestructura dedicada, hablamos.</p>
          </div>
          <Link
            href="/contacto"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/7 transition-all shrink-0"
          >
            Contactar ventas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
