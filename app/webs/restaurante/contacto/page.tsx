"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, UtensilsCrossed } from "lucide-react"
import { brand, services } from "../data/index"

export default function RestauranteContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", servicio: "", personas: "2", fecha: "", hora: "", ocasion: "", nota: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#120b04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-amber-900/8 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Reservaciones disponibles
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Reserva</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent italic">tu mesa</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Confirmaremos tu reservación en menos de 2 horas. Para grupos de más de 8 personas, llámanos directamente.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-amber-800/25 bg-amber-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3 italic">¡Reservación recibida!</h2>
                <p className="text-white/40">Confirmaremos por correo y WhatsApp en menos de 2 horas. ¡Te esperamos!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-amber-950/12 border border-amber-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6 italic">Información de la reservación</h2>
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
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Experiencia</label>
                    <select aria-label="Experiencia" value={form.servicio} onChange={e => setForm({...form, servicio: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#120b04]">Selecciona</option>
                      {services.map(s => <option key={s.name} value={s.name} className="bg-[#120b04]">{s.name}</option>)}
                      <option value="taller" className="bg-[#120b04]">Taller de cocina (sábados)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Número de personas</label>
                    <select aria-label="Personas" value={form.personas} onChange={e => setForm({...form, personas: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      {["1","2","3","4","5","6","7","8","Más de 8 (salón privado)"].map(n => <option key={n} value={n} className="bg-[#120b04]">{n} {n === "1" ? "persona" : n === "Más de 8 (salón privado)" ? "" : "personas"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Fecha preferida</label>
                    <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Hora preferida</label>
                    <select aria-label="Hora" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#120b04]">Selecciona hora</option>
                      {["13:00","13:30","14:00","14:30","15:00","19:00","19:30","20:00","20:30","21:00","21:30","22:00"].map(h => <option key={h} value={h} className="bg-[#120b04]">{h}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Ocasión especial (opcional)</label>
                    <input type="text" placeholder="Aniversario, cumpleaños, reunión de negocios..." value={form.ocasion} onChange={e => setForm({...form, ocasion: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Alergias o restricciones alimenticias</label>
                    <textarea rows={2} placeholder="Vegetariano, celiaco, alergia a nueces..." value={form.nota} onChange={e => setForm({...form, nota: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/25 text-sm tracking-wide italic">
                  Solicitar reservación →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Confirmamos en menos de 2 horas hábiles · Lunes–Sábado</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10">
              <h3 className="font-bold text-white mb-4 italic">Información</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-amber-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Sábado</span><span className="text-white/55">13:00 – 23:00</span></div>
                <div className="flex justify-between"><span>Domingo</span><span className="text-white/55">13:00 – 18:00</span></div>
                <div className="flex justify-between"><span>Cocina cierra</span><span className="text-amber-500/60">22:30 (22h dom)</span></div>
                <div className="flex justify-between"><span className="text-amber-500/70">Taller de cocina</span><span className="text-amber-400/70">Sáb 10:00–13:00</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-amber-500/60" /> Por qué reservar</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Confirmación garantizada en 2 horas", "Menú adaptable a restricciones", "Valet parking incluido", "Decoración especial para ocasiones", "Carta de vinos curada por sommelier WSET"].map(item => (
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
