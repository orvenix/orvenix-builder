"use client"
import Link from "next/link"
import { habitaciones, paquetes } from "../data/index"

export default function HotelHabitaciones() {
  return (
    <div className="min-h-screen bg-[#100c06]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-amber-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">86 habitaciones y suites</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Habitaciones</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-stone-400 bg-clip-text text-transparent">& Suites</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Desde habitaciones de lujo hasta la Suite Presidencial con vista panorámica de la ciudad. Cada espacio diseñado para el descanso más exigente.</p>
        </div>
      </section>

      <section className="pb-16 max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {habitaciones.map(h => (
            <div key={h.name} className={`p-7 rounded-3xl border ${h.border} ${h.bg}`}>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      {h.badge && <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${h.bg} ${h.color} border ${h.border} mb-2 inline-block`}>{h.badge}</span>}
                      <h2 className="text-2xl font-black text-white">{h.name}</h2>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-black ${h.color}`}>{h.price}</p>
                      <p className="text-xs text-white/30">por {h.night}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-4 text-xs text-white/40">
                    <span>📐 {h.size}</span>
                    <span>🏙️ {h.view}</span>
                    <span>👤 {h.guests} huéspedes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {h.amenities.map(a => (
                      <div key={a} className="flex items-center gap-1.5 text-xs text-white/40">
                        <span className={`${h.color} text-[10px]`}>✓</span> {a}
                      </div>
                    ))}
                  </div>
                  <Link href="/webs/hotel/contacto" className={`inline-flex items-center gap-1.5 text-sm font-bold ${h.color} hover:opacity-80 transition-opacity`}>
                    Reservar esta habitación →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paquetes */}
      <section className="py-16 bg-[#0c0904]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-10">Paquetes especiales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paquetes.map(p => (
              <div key={p.name} className={`p-6 rounded-2xl border transition-all ${p.highlight ? "border-amber-600/40 bg-amber-950/20" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-amber-400/70">{p.price}</p>
                  </div>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#100c06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">Las mejores tarifas disponibles directamente con nosotros</p>
          <Link href="/webs/hotel/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Verificar disponibilidad
          </Link>
        </div>
      </section>
    </div>
  )
}
