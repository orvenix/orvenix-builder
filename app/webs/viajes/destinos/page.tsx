"use client"
import { useState } from "react"
import Link from "next/link"
import { destinos, categories } from "../data/index"

const regiones = ["Todos", "México", "Europa", "Asia", "América", "Caribe"]

export default function ViajesDestinos() {
  const [region, setRegion] = useState("Todos")

  const regionMap: Record<string, string[]> = {
    México: ["Riviera Maya", "Cancún, México"],
    Europa: ["París, Francia", "Roma & Toscana", "Santorini, Grecia"],
    Asia: ["Tokio, Japón"],
    Caribe: ["Cancún, México", "Riviera Maya"],
    América: [],
  }

  const filtrados = region === "Todos" ? destinos : destinos.filter(d => (regionMap[region] || []).includes(d.name) || d.name.includes(region))

  return (
    <div className="bg-[#08080f] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-800/25 text-orange-500 text-xs mb-6">120+ destinos</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Destinos disponibles</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">México, Europa, Asia, Caribe, América y más. Consulta con un asesor para obtener el precio actualizado y el itinerario ideal para tus fechas.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {regiones.map(r => (
            <button key={r} onClick={() => setRegion(r)} className={`px-4 py-2 text-sm rounded-xl border transition-all font-medium ${region === r ? "bg-orange-600 border-orange-600 text-white" : "border-white/10 text-white/40 hover:text-white/70"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {(filtrados.length > 0 ? filtrados : destinos).map(d => (
            <div key={d.name} className={`rounded-3xl bg-gradient-to-br ${d.gradient} border border-white/[0.06] overflow-hidden hover:scale-[1.01] transition-all`}>
              <div className="h-36 flex items-end px-6 pb-4 relative">
                <div className="text-4xl">{d.emoji}</div>
                <div className="ml-auto">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/10 text-white/70 border border-white/15">{d.tag}</span>
                </div>
              </div>
              <div className="p-6 bg-black/20">
                <h3 className="font-black text-white text-xl mb-1">{d.name}</h3>
                <p className="text-sm text-white/40 mb-4">{d.desc}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/30">{d.noches} · por persona</div>
                    <div className="font-black text-white text-lg">Desde {d.desde} <span className="text-xs font-normal text-white/35">MXN</span></div>
                  </div>
                  <Link href="/webs/viajes/contacto" className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-all">
                    Cotizar →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="py-16 bg-gradient-to-b from-[#08080f] to-[#0c080c]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">¿Qué tipo de viaje buscas?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(c => {
              const Icon = c.icon
              return (
                <Link key={c.id} href="/webs/viajes/contacto" className={`p-5 rounded-2xl border ${c.border} ${c.bg} hover:scale-[1.01] transition-all`}>
                  <Icon className={`w-6 h-6 ${c.color} mb-3`} />
                  <h3 className="font-bold text-white text-sm mb-1">{c.title}</h3>
                  <p className={`text-xs font-bold ${c.color}`}>{c.desde}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿No encuentras tu destino?</h2>
          <p className="text-white/35 mb-8">Nuestros asesores tienen acceso a más de 120 destinos. Cuéntanos a dónde quieres ir y te preparamos un itinerario en 24 horas.</p>
          <Link href="/webs/viajes/contacto" className="px-10 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all">
            Hablar con un asesor →
          </Link>
        </div>
      </section>
    </div>
  )
}
