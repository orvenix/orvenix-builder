"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function NotariaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", tramite: "", descripcion: "" })
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="bg-[#080a0e] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-yellow-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-6">Solicitar cita</div>
          <h1 className="text-5xl font-black mb-4">Agenda tu cita notarial</h1>
          <p className="text-white/35 text-lg max-w-xl mx-auto">El equipo de la Notaría te responde en menos de 24 horas hábiles para confirmar tu cita y orientarte sobre el trámite.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-5">Información de la Notaría</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Teléfono</p><p className="text-sm text-white/70">{brand.phone}</p></div></div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Correo</p><p className="text-sm text-white/70">{brand.email}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Domicilio</p><p className="text-sm text-white/70">{brand.address}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Horario de atención</p><p className="text-sm text-white/70">Lun–Vie 9:00–18:00</p><p className="text-sm text-white/70">Sáb 10:00–13:00</p></div></div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-yellow-900/20 bg-yellow-950/8">
              <h4 className="font-bold text-white mb-3 text-sm">En la consulta inicial</h4>
              {["Orientación sobre el trámite", "Presupuesto detallado sin costo", "Lista de documentos a integrar", "Estimación de plazos reales"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/35 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-yellow-600/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
              <p className="text-xs text-white/25 leading-relaxed">La orientación inicial es sin costo y sin compromiso. El presupuesto definitivo se entrega por escrito antes de iniciar cualquier trámite.</p>
            </div>
          </div>

          <div className="md:col-span-3">
            {!enviado ? (
              <form onSubmit={e => { e.preventDefault(); setEnviado(true) }} className="bg-yellow-950/8 border border-yellow-800/18 rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input type="text" placeholder="Tu nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Teléfono</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/40 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Trámite que requiere</label>
                    <select value={form.tramite} onChange={e => setForm({...form, tramite: e.target.value})} aria-label="Trámite notarial" className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white focus:outline-none focus:border-yellow-600/40 text-sm">
                      <option value="" className="bg-[#080a0e]">Selecciona el trámite</option>
                      {["Escrituración inmobiliaria", "Testamento", "Poder notarial", "Constitución de sociedad", "Fe de hechos / certificación", "Sucesión / herencia", "Apostilla", "No sé qué trámite necesito"].map(t => (
                        <option key={t} value={t} className="bg-[#080a0e]">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-yellow-500/60 uppercase tracking-wider mb-2">Describe brevemente tu situación</label>
                    <textarea rows={4} placeholder="Cuéntanos el contexto: tipo de bien, partes involucradas, urgencia, preguntas específicas..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-yellow-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-600/40 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all shadow-xl shadow-yellow-900/25 text-sm">
                  Solicitar cita notarial →
                </button>
                <p className="text-center text-xs text-white/20">Toda la información se trata con estricta confidencialidad profesional.</p>
              </form>
            ) : (
              <div className="bg-yellow-950/8 border border-yellow-800/18 rounded-3xl p-12 text-center">
                <CheckCircle className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">¡Solicitud recibida!</h3>
                <p className="text-white/45 mb-2">El personal de la {brand.name} {brand.numero} se pondrá en contacto contigo en menos de 24 horas hábiles para confirmar tu cita.</p>
                <p className="text-xs text-white/25">Para urgencias, comunícate directamente al {brand.phone}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
