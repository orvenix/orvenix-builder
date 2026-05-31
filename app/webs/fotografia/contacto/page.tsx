"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, Camera } from "lucide-react"
import { brand, services } from "../data/index"

export default function FotografiaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", servicio: "", fecha: "", mensaje: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#080708]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-yellow-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-700/25 text-yellow-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Disponibilidad abierta
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Reserva tu</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">sesión</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Cuéntanos tu proyecto y verificamos disponibilidad. Propuesta personalizada en menos de 24 horas.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-yellow-800/25 bg-yellow-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Solicitud recibida!</h2>
                <p className="text-white/40 leading-relaxed">Revisamos disponibilidad y te contactamos con propuesta personalizada en menos de 24 horas hábiles.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-yellow-950/12 border border-yellow-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Cuéntanos tu proyecto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Tipo de sesión</label>
                    <select aria-label="Tipo de sesión" value={form.servicio} onChange={e => setForm({ ...form, servicio: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white focus:outline-none focus:border-yellow-600/45 text-sm">
                      <option value="" className="bg-[#080708]">Selecciona el servicio</option>
                      {services.map(s => <option key={s.id} value={s.name} className="bg-[#080708]">{s.name}</option>)}
                      <option value="otro" className="bg-[#080708]">Otro / No estoy seguro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Fecha tentativa</label>
                    <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white focus:outline-none focus:border-yellow-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Cuéntanos más sobre tu proyecto</label>
                    <textarea rows={4} placeholder="Lugar, número de personas, estilo deseado, referencias de otras fotos que te gusten..." value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-xl shadow-yellow-900/25 text-sm tracking-wide">
                  Solicitar cotización y disponibilidad →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Respuesta en menos de 24 horas hábiles. Sin compromiso.</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-yellow-800/20 bg-yellow-950/10">
              <h3 className="font-bold text-white mb-4">Información de contacto</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-yellow-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-yellow-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-yellow-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-yellow-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Viernes</span><span className="text-white/55">10:00 – 19:00</span></div>
                <div className="flex justify-between"><span>Sábado</span><span className="text-white/55">10:00 – 15:00</span></div>
                <div className="flex justify-between"><span className="text-yellow-600/70">Sesiones y eventos</span><span className="text-yellow-500/70">Según agenda</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><Camera className="w-4 h-4 text-yellow-500/60" /> ¿Por qué elegirnos?</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["9 años de experiencia comprobada", "Canon Explorer of Light certificado", "Drone certificado AFAC", "Entrega garantizada en tiempo acordado", "Galería privada en línea"].map(item => (
                  <div key={item} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-yellow-600/50 shrink-0" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
