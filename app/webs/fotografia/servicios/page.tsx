"use client"
import Link from "next/link"
import { services } from "../data/index"

export default function FotografiaServicios() {
  return (
    <div className="min-h-screen bg-[#080708]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-yellow-900/5 rounded-full blur-[130px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-400 text-xs mb-6">Servicios</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Paquetes</span>{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">fotográficos</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Desde sesiones íntimas hasta producciones completas de día. Cada paquete incluye asesoría previa, dirección durante la sesión y edición artística.
          </p>
        </div>
      </section>

      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="space-y-8">
          {services.map(s => {
            const Icon = s.icon
            return (
              <div key={s.id} className={`p-8 rounded-3xl border ${s.border} ${s.bg}`}>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${s.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{s.name}</h2>
                        <p className={`text-sm ${s.color} mt-1 font-semibold`}>{s.desde}</p>
                      </div>
                    </div>
                    <p className="text-white/45 leading-relaxed mb-5">{s.fullDesc}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1 text-xs rounded-full ${s.bg} ${s.color} border ${s.border}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-60 shrink-0">
                    <div className={`p-6 rounded-2xl border ${s.border} bg-black/20 h-full flex flex-col justify-between`}>
                      <div>
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Desde</p>
                        <p className={`text-xl font-black ${s.color} mb-4`}>{s.desde}</p>
                        <div className="space-y-2 text-xs text-white/30 mb-6">
                          <p>✓ Asesoría de vestuario</p>
                          <p>✓ Dirección durante la sesión</p>
                          <p>✓ Edición artística incluida</p>
                          <p>✓ Galería privada en línea</p>
                        </div>
                      </div>
                      <Link href="/webs/fotografia/contacto" className={`block text-center py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${s.bg} border ${s.border} hover:brightness-125`}>
                        Solicitar cotización
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#080708] to-[#0b090a]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">¿No encuentras lo que buscas?</h2>
          <p className="text-white/35 mb-8">Creamos paquetes personalizados. Cuéntanos tu proyecto y te enviamos una propuesta en 24 horas.</p>
          <Link href="/webs/fotografia/contacto" className="px-8 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/30 inline-block">
            Cotización personalizada
          </Link>
        </div>
      </section>
    </div>
  )
}
