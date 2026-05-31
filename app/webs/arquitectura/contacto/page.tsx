"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function ArquitecturaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", tipo: "", presupuesto: "", descripcion: "" })
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnviado(true)
  }

  return (
    <div className="bg-[#0a0908] min-h-screen">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-amber-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-800/25 text-amber-500 text-xs mb-6">Consulta gratuita</div>
          <h1 className="text-5xl font-black mb-4">Hablemos de tu proyecto</h1>
          <p className="text-white/35 text-lg max-w-xl mx-auto">Cuéntanos tu idea. En menos de 24h un arquitecto del equipo te contacta para agendar la visita inicial sin costo.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* INFO */}
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-5">Información de contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-0.5">Teléfono</p>
                    <p className="text-sm text-white/70">{brand.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-0.5">Correo</p>
                    <p className="text-sm text-white/70">{brand.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-0.5">Estudio</p>
                    <p className="text-sm text-white/70">{brand.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-0.5">Horario</p>
                    <p className="text-sm text-white/70">Lun–Vie 9:00–19:00</p>
                    <p className="text-sm text-white/70">Sáb 10:00–14:00</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-amber-900/20 bg-amber-950/8">
              <h4 className="font-bold text-white mb-3 text-sm">¿Qué incluye la consulta inicial?</h4>
              {["Visita al predio o espacio", "Revisión de programa de necesidades", "Estimación preliminar de presupuesto", "Presentación del equipo asignado"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/35 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="md:col-span-3">
            {!enviado ? (
              <form onSubmit={handleSubmit} className="bg-amber-950/8 border border-amber-800/18 rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Tipo de proyecto</label>
                    <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} aria-label="Tipo de proyecto"
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/40 text-sm">
                      <option value="" className="bg-[#0a0908]">Selecciona</option>
                      {["Residencial", "Comercial", "Diseño de Interiores", "Remodelación", "Paisajismo", "Sustentable"].map(t => (
                        <option key={t} value={t} className="bg-[#0a0908]">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Presupuesto aproximado</label>
                    <select value={form.presupuesto} onChange={e => setForm({...form, presupuesto: e.target.value})} aria-label="Presupuesto aproximado"
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/40 text-sm">
                      <option value="" className="bg-[#0a0908]">Selecciona rango</option>
                      {["Menos de $500K", "$500K – $2M", "$2M – $5M", "$5M – $15M", "Más de $15M"].map(p => (
                        <option key={p} value={p} className="bg-[#0a0908]">{p} MXN</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Descripción del proyecto</label>
                    <textarea rows={4} placeholder="Cuéntanos: ¿qué necesitas construir o diseñar? ¿Tienes predio o local? ¿Cuántos m²?" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/40 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/25 text-sm tracking-wide">
                  Solicitar consulta gratuita →
                </button>
                <p className="text-center text-xs text-white/20">Tu información es confidencial y no será compartida con terceros.</p>
              </form>
            ) : (
              <div className="bg-amber-950/8 border border-amber-800/18 rounded-3xl p-12 text-center">
                <CheckCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">¡Recibimos tu solicitud!</h3>
                <p className="text-white/45 mb-6">Un arquitecto de nuestro equipo te contactará en menos de 24 horas para agendar la consulta.</p>
                <p className="text-xs text-white/25">Mientras tanto, puedes revisar nuestros proyectos en el portafolio.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
