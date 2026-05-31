"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function RRHHContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", empresa: "", empleados: "", servicio: "", descripcion: "" })
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="bg-[#090714] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-violet-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/25 text-violet-500 text-xs mb-6">Diagnóstico gratuito</div>
          <h1 className="text-5xl font-black mb-4">Solicita tu diagnóstico</h1>
          <p className="text-white/35 text-lg max-w-xl mx-auto">Gratis, sin compromiso. En 48h tendrás una evaluación de madurez en gestión de talento y recomendaciones concretas para tu empresa.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-5">Contacto directo</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Teléfono</p><p className="text-sm text-white/70">{brand.phone}</p></div></div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Correo</p><p className="text-sm text-white/70">{brand.email}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Oficina</p><p className="text-sm text-white/70">{brand.address}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Horario</p><p className="text-sm text-white/70">Lun–Vie 8:30–18:30</p></div></div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-violet-900/20 bg-violet-950/8">
              <h4 className="font-bold text-white mb-3 text-sm">El diagnóstico incluye</h4>
              {["Evaluación de madurez en gestión de talento", "Identificación de brechas críticas", "Recomendaciones priorizadas por impacto", "Propuesta de intervención personalizada", "Estimación de ROI esperado"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/35 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-600/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            {!enviado ? (
              <form onSubmit={e => { e.preventDefault(); setEnviado(true) }} className="bg-violet-950/8 border border-violet-800/18 rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Tu nombre</label>
                    <input type="text" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Correo corporativo</label>
                    <input type="email" placeholder="tu@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Teléfono</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Empresa</label>
                    <input type="text" placeholder="Nombre de tu empresa" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Número de empleados</label>
                    <select value={form.empleados} onChange={e => setForm({...form, empleados: e.target.value})} aria-label="Empleados" className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white focus:outline-none focus:border-violet-600/40 text-sm">
                      <option value="" className="bg-[#090714]">Selecciona</option>
                      {["1–10 empleados", "11–50 empleados", "51–200 empleados", "201–500 empleados", "500+ empleados"].map(e => <option key={e} value={e} className="bg-[#090714]">{e}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">Servicio de interés principal</label>
                    <select value={form.servicio} onChange={e => setForm({...form, servicio: e.target.value})} aria-label="Servicio" className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white focus:outline-none focus:border-violet-600/40 text-sm">
                      <option value="" className="bg-[#090714]">Selecciona</option>
                      {["Reclutamiento & selección", "Administración de nómina", "Capacitación & desarrollo", "Clima organizacional", "Gestión del desempeño", "Outplacement", "Consultoría integral", "No estoy seguro"].map(s => <option key={s} value={s} className="bg-[#090714]">{s}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-violet-500/60 uppercase tracking-wider mb-2">¿Cuál es tu principal reto de RRHH hoy?</label>
                    <textarea rows={4} placeholder="Ej: Rotación alta, dificultad para reclutar tech talent, evaluaciones sin criterios objetivos, nómina con errores..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-violet-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-600/40 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-xl shadow-violet-900/25 text-sm">
                  Solicitar diagnóstico gratuito →
                </button>
                <p className="text-center text-xs text-white/20">Toda la información es confidencial. Respondemos en máximo 48 horas hábiles.</p>
              </form>
            ) : (
              <div className="bg-violet-950/8 border border-violet-800/18 rounded-3xl p-12 text-center">
                <CheckCircle className="w-14 h-14 text-violet-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">¡Solicitud recibida!</h3>
                <p className="text-white/45 mb-2">Uno de nuestros consultores revisará tu información y te contactará en máximo 48 horas hábiles con el diagnóstico inicial.</p>
                <p className="text-xs text-white/25">Sin costo. Sin compromiso de contratación.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
