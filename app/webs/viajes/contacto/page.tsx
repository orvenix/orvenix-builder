"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function ViajesContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", destino: "", fechas: "", personas: "", presupuesto: "", tipo: "", notas: "" })
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="bg-[#08080f] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-orange-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-800/25 text-orange-500 text-xs mb-6">Cotización sin compromiso</div>
          <h1 className="text-5xl font-black mb-4">Planea tu próximo viaje</h1>
          <p className="text-white/35 text-lg max-w-xl mx-auto">Cuéntanos a dónde quieres ir. En 24h tienes tu itinerario personalizado con el mejor precio del mercado.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-5">Contacto directo</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Teléfono / WhatsApp</p><p className="text-sm text-white/70">{brand.whatsapp}</p></div></div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Correo</p><p className="text-sm text-white/70">{brand.email}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Oficina</p><p className="text-sm text-white/70">{brand.address}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Horario</p><p className="text-sm text-white/70">Lun–Sáb 9:00–20:00</p><p className="text-sm text-white/70">Dom 10:00–16:00</p></div></div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-orange-900/20 bg-orange-950/8">
              <h4 className="font-bold text-white mb-3 text-sm">Tu cotización incluye</h4>
              {["Hasta 3 opciones de itinerario", "Precios actualizados de vuelos y hoteles", "Comparativa de aerolíneas", "Seguro de viajero cotizado", "Opción de pago a meses"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/35 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-orange-600/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            {!enviado ? (
              <form onSubmit={e => { e.preventDefault(); setEnviado(true) }} className="bg-orange-950/8 border border-orange-800/18 rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Correo</label>
                    <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Destino deseado</label>
                    <input type="text" placeholder="Ej: París, Cancún, Japón..." value={form.destino} onChange={e => setForm({...form, destino: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Fechas aproximadas</label>
                    <input type="text" placeholder="Ej: Julio 2025, 10-20 días" value={form.fechas} onChange={e => setForm({...form, fechas: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Número de viajeros</label>
                    <select value={form.personas} onChange={e => setForm({...form, personas: e.target.value})} aria-label="Número de viajeros" className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white focus:outline-none focus:border-orange-600/40 text-sm">
                      <option value="" className="bg-[#08080f]">Selecciona</option>
                      {["1 viajero", "2 viajeros (pareja)", "3-4 (familia pequeña)", "5-8 (familia/grupo)", "9+ (grupo grande)"].map(p => <option key={p} value={p} className="bg-[#08080f]">{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Presupuesto por persona</label>
                    <select value={form.presupuesto} onChange={e => setForm({...form, presupuesto: e.target.value})} aria-label="Presupuesto" className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white focus:outline-none focus:border-orange-600/40 text-sm">
                      <option value="" className="bg-[#08080f]">Selecciona rango</option>
                      {["Menos de $10K MXN", "$10K – $25K MXN", "$25K – $50K MXN", "$50K – $100K MXN", "Más de $100K MXN"].map(p => <option key={p} value={p} className="bg-[#08080f]">{p}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Comentarios adicionales</label>
                    <textarea rows={3} placeholder="Preferencias de hotel, si es luna de miel, necesidades especiales, actividades que les interesan..." value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/40 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/25 text-sm">
                  Solicitar cotización gratuita →
                </button>
                <p className="text-center text-xs text-white/20">Respuesta garantizada en menos de 24 horas hábiles.</p>
              </form>
            ) : (
              <div className="bg-orange-950/8 border border-orange-800/18 rounded-3xl p-12 text-center">
                <div className="text-5xl mb-4">✈️</div>
                <h3 className="text-2xl font-black text-white mb-2">¡Pronto estarás viajando!</h3>
                <p className="text-white/45 mb-2">Recibimos tu solicitud. En menos de 24 horas un asesor te enviará hasta 3 opciones de itinerario personalizadas.</p>
                <p className="text-xs text-white/25">Revisa también tu carpeta de spam.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
