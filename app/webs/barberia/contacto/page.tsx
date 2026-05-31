"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand, servicios, equipo } from "../data/index"

export default function BarberiaContacto() {
  const [form, setForm] = useState({ nombre: "", telefono: "", servicio: "", barbero: "", fecha: "", hora: "", nota: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#0c0906]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-amber-900/8 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Agenda disponible
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Reserva</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-stone-400 bg-clip-text text-transparent italic">tu cita</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Confirmaremos por WhatsApp en menos de 1 hora. Sin cita también nos puedes visitar sujeto a disponibilidad.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-amber-800/25 bg-amber-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3 italic">¡Cita registrada!</h2>
                <p className="text-white/40">Te confirmamos por WhatsApp en menos de 1 hora. ¡Nos vemos!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-amber-950/12 border border-amber-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6 italic">Agendar cita</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Nombre</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">WhatsApp</label>
                    <input required type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Servicio</label>
                    <select aria-label="Servicio" value={form.servicio} onChange={e => setForm({...form, servicio: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0c0906]">Selecciona servicio</option>
                      {servicios.map(s => <option key={s.nombre} value={s.nombre} className="bg-[#0c0906]">{s.nombre} — {s.precio}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Barbero preferido</label>
                    <select aria-label="Barbero" value={form.barbero} onChange={e => setForm({...form, barbero: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0c0906]">Sin preferencia</option>
                      {equipo.map(e => <option key={e.name} value={e.name} className="bg-[#0c0906]">{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Fecha</label>
                    <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Hora preferida</label>
                    <select aria-label="Hora" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0c0906]">Selecciona hora</option>
                      {["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"].map(h => <option key={h} value={h} className="bg-[#0c0906]">{h}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Notas adicionales (opcional)</label>
                    <input type="text" placeholder="Referencia de corte, alergias, primera vez..." value={form.nota} onChange={e => setForm({...form, nota: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/25 text-sm italic">
                  Reservar cita →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Confirmación por WhatsApp en menos de 1 hora</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10">
              <h3 className="font-bold text-white mb-4 italic">Encuéntranos</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-amber-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Sábado</span><span className="text-white/55">9:00 – 20:00</span></div>
                <div className="flex justify-between"><span>Domingo</span><span className="text-white/55">10:00 – 18:00</span></div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm">Por qué Señorío</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["10 años en la Roma Norte","4 maestros barberos certificados","Productos naturales artesanales","+920 reseñas 5 estrellas en Google","3 sucursales en CDMX"].map(item => (
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
