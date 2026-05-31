"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, Hotel } from "lucide-react"
import { brand, habitaciones, paquetes } from "../data/index"

export default function HotelContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", habitacion: "", paquete: "", checkin: "", checkout: "", personas: "2", ocasion: "", nota: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#100c06]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-amber-900/6 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Disponibilidad en tiempo real
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Reservar</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-stone-400 bg-clip-text text-transparent">estancia</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Confirmamos disponibilidad en menos de 2 horas. Mejor precio garantizado al reservar directamente con nosotros.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-amber-800/25 bg-amber-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Reservación solicitada!</h2>
                <p className="text-white/40">Confirmaremos disponibilidad y tarifa en menos de 2 horas. Recibirás confirmación por correo y WhatsApp.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-amber-950/12 border border-amber-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Solicitar reservación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Correo</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Tipo de habitación</label>
                    <select aria-label="Habitación" value={form.habitacion} onChange={e => setForm({...form, habitacion: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#100c06]">Selecciona habitación</option>
                      {habitaciones.map(h => <option key={h.name} value={h.name} className="bg-[#100c06]">{h.name} — desde {h.price}/noche</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Paquete (opcional)</label>
                    <select aria-label="Paquete" value={form.paquete} onChange={e => setForm({...form, paquete: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#100c06]">Sin paquete especial</option>
                      {paquetes.map(p => <option key={p.name} value={p.name} className="bg-[#100c06]">{p.icon} {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Check-in</label>
                    <input type="date" value={form.checkin} onChange={e => setForm({...form, checkin: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Check-out</label>
                    <input type="date" value={form.checkout} onChange={e => setForm({...form, checkout: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Número de huéspedes</label>
                    <select aria-label="Huéspedes" value={form.personas} onChange={e => setForm({...form, personas: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      {["1","2","3","4"].map(n => <option key={n} value={n} className="bg-[#100c06]">{n} {n === "1" ? "huésped" : "huéspedes"}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Ocasión especial o solicitudes</label>
                    <textarea rows={3} placeholder="Luna de miel, cumpleaños, dieta especial, cuna para bebé..." value={form.nota} onChange={e => setForm({...form, nota: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/25 text-sm">
                  Solicitar disponibilidad →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Mejor precio garantizado · Confirmación en 2 horas</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10">
              <h3 className="font-bold text-white mb-4">Contacto directo</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-amber-600/60" /> <h3 className="font-bold text-white text-sm">Recepción</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Recepción & Concierge</span><span className="text-amber-400/70">24 / 7</span></div>
                <div className="flex justify-between"><span>Check-in</span><span className="text-white/55">15:00</span></div>
                <div className="flex justify-between"><span>Check-out</span><span className="text-white/55">12:00</span></div>
                <div className="flex justify-between"><span>Late check-out</span><span className="text-white/55">Hasta 15:00 sin cargo*</span></div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><Hotel className="w-4 h-4 text-amber-500/60" /> Por qué reservar directo</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Mejor precio garantizado","Sin cargo por cancelación 48h antes","Peticiones especiales atendidas","Check-in online disponible","Upgrade sujeto a disponibilidad"].map(item => (
                  <div key={item} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-amber-600/50 shrink-0" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
