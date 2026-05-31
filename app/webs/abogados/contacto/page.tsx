"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function AbogadosContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", area: "", descripcion: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-amber-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Consultas disponibles hoy
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Agenda tu</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">consulta gratuita</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">
            Cuéntanos tu caso. En menos de 4 horas tendrás respuesta de uno de nuestros abogados especializados.
          </p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* FORM */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-amber-800/25 bg-amber-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Recibimos tu solicitud!</h2>
                <p className="text-white/40 leading-relaxed">Uno de nuestros abogados revisará tu caso y te contactará en menos de 4 horas hábiles. Revisa tu bandeja de entrada.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-amber-950/12 border border-amber-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Cuéntanos tu caso</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Tu nombre completo"
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input
                      required
                      type="email"
                      placeholder="tu@correo.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+52 55 0000 0000"
                      value={form.telefono}
                      onChange={e => setForm({ ...form, telefono: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Área jurídica</label>
                    <select
                      aria-label="Área jurídica"
                      value={form.area}
                      onChange={e => setForm({ ...form, area: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm"
                    >
                      <option value="" className="bg-[#070b14]">Selecciona un área</option>
                      {["Laboral", "Mercantil", "Familiar", "Penal", "Inmobiliario", "Corporativo", "No estoy seguro"].map(a => (
                        <option key={a} value={a} className="bg-[#070b14]">{a}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Describe brevemente tu situación</label>
                    <textarea
                      rows={5}
                      placeholder="Cuéntanos los hechos principales de tu caso..."
                      value={form.descripcion}
                      onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm resize-none"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/25 text-sm tracking-wide">
                  Solicitar consulta gratuita →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Toda la información está protegida por secreto profesional absoluto.</p>
              </form>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10">
              <h3 className="font-bold text-white mb-4">Información de contacto</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-amber-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Viernes</span> <span className="text-white/55">9:00 – 19:00</span></div>
                <div className="flex justify-between"><span>Sábado</span> <span className="text-white/55">10:00 – 14:00</span></div>
                <div className="flex justify-between"><span className="text-amber-600/70">Emergencias penales</span> <span className="text-amber-500/70">24/7</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm">¿Por qué nosotros?</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Consulta inicial gratuita de 45 min", "Propuesta de honorarios por escrito", "Sin cuotas ocultas", "Respuesta en menos de 4 horas", "Asesoría 100% digital disponible"].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-amber-600/50 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
