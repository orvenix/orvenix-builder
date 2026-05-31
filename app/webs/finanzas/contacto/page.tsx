"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { brand } from "../data/index"

export default function FinanzasContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", servicio: "", patrimonio: "", mensaje: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#040f0a]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-emerald-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-700/25 text-emerald-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Diagnóstico financiero gratuito
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Hablemos de</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">tu patrimonio</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">
            Primera reunión de 60 minutos sin costo. Analizamos tu situación y te decimos honestamente qué mejoraría.
          </p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-emerald-800/25 bg-emerald-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Solicitud recibida!</h2>
                <p className="text-white/40 leading-relaxed">Un asesor senior revisará tu información y te contactará dentro de las próximas 24 horas para agendar tu diagnóstico financiero.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-emerald-950/12 border border-emerald-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Agendar diagnóstico financiero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Servicio de interés</label>
                    <select aria-label="Servicio de interés" value={form.servicio} onChange={e => setForm({ ...form, servicio: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white focus:outline-none focus:border-emerald-600/45 text-sm">
                      <option value="" className="bg-[#040f0a]">Selecciona el área de interés</option>
                      {["Gestión patrimonial", "Planeación financiera", "Planeación para el retiro", "Optimización fiscal", "Finanzas corporativas", "Acceso a mercados", "Revisión de portafolio existente", "No sé por dónde empezar"].map(o => (
                        <option key={o} value={o} className="bg-[#040f0a]">{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Patrimonio aproximado a gestionar (opcional)</label>
                    <select aria-label="Patrimonio aproximado" value={form.patrimonio} onChange={e => setForm({ ...form, patrimonio: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white focus:outline-none focus:border-emerald-600/45 text-sm">
                      <option value="" className="bg-[#040f0a]">Prefiero no decirlo por ahora</option>
                      {["Menos de $500,000 MXN", "$500K – $2M MXN", "$2M – $10M MXN", "$10M – $50M MXN", "Más de $50M MXN", "Empresa (Finanzas corporativas)"].map(o => (
                        <option key={o} value={o} className="bg-[#040f0a]">{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-emerald-500/60 uppercase tracking-wider mb-2">Contexto adicional (opcional)</label>
                    <textarea rows={4} placeholder="Cuéntanos brevemente tu situación: objetivo principal, plazo de inversión, experiencia previa..." value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-emerald-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-emerald-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/25 text-sm tracking-wide">
                  Solicitar diagnóstico gratuito →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Información confidencial. Nunca la compartimos con terceros.</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-emerald-800/20 bg-emerald-950/10">
              <h3 className="font-bold text-white mb-4">Contacto directo</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-emerald-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-emerald-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-emerald-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-emerald-600/60" /> <h3 className="font-bold text-white text-sm">Disponibilidad</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Viernes</span> <span className="text-white/55">9:00 – 18:00</span></div>
                <div className="flex justify-between"><span>Reuniones virtuales</span> <span className="text-white/55">Flexible</span></div>
                <div className="flex justify-between"><span>Respuesta a solicitudes</span> <span className="text-emerald-500/70">{'< 24 horas'}</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500/60" /> ¿Qué esperar?
              </h3>
              <div className="space-y-2 text-xs text-white/35">
                {[
                  "Diagnóstico de 60 min sin costo",
                  "Sin presión de venta ni compromiso",
                  "Plan financiero por escrito",
                  "Asesor senior dedicado",
                  "Regulado por la CNBV",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600/50 shrink-0" /> {item}
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
