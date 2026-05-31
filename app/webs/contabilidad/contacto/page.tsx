"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { brand } from "../data/index"

export default function ContabilidadContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", empresa: "", regimen: "", descripcion: "" })
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="bg-[#070f14] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-teal-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/20 border border-teal-800/25 text-teal-500 text-xs mb-6">Diagnóstico gratuito</div>
          <h1 className="text-5xl font-black mb-4">Solicita tu diagnóstico fiscal</h1>
          <p className="text-white/35 text-lg max-w-xl mx-auto">Gratis, en 48 horas. Te decimos qué obligaciones tienes, si estás al corriente y qué régimen te conviene más.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-5">Información de contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Teléfono</p><p className="text-sm text-white/70">{brand.phone}</p></div></div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Correo</p><p className="text-sm text-white/70">{brand.email}</p></div></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Oficina</p><p className="text-sm text-white/70">{brand.address}</p></div></div>
                <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /><div><p className="text-xs text-white/30 mb-0.5">Horario</p><p className="text-sm text-white/70">Lun–Vie 9:00–19:00</p></div></div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-teal-900/20 bg-teal-950/8">
              <h4 className="font-bold text-white mb-3 text-sm">¿Qué incluye el diagnóstico?</h4>
              {["Revisión de obligaciones ante el SAT", "Detección de posibles contingencias", "Recomendación de régimen fiscal óptimo", "Propuesta de honorarios transparente"].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/35 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600/60 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            {!enviado ? (
              <form onSubmit={e => { e.preventDefault(); setEnviado(true) }} className="bg-teal-950/8 border border-teal-800/18 rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input type="email" placeholder="tu@empresa.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Teléfono</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Empresa / Negocio</label>
                    <input type="text" placeholder="Nombre de tu empresa" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/40 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Régimen fiscal actual</label>
                    <select value={form.regimen} onChange={e => setForm({...form, regimen: e.target.value})} aria-label="Régimen fiscal"
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white focus:outline-none focus:border-teal-600/40 text-sm">
                      <option value="" className="bg-[#070f14]">Selecciona</option>
                      {["Persona física actividad empresarial", "RESICO persona física", "Persona moral régimen general", "No estoy registrado", "No sé mi régimen"].map(r => (
                        <option key={r} value={r} className="bg-[#070f14]">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">¿Cuál es tu situación actual?</label>
                    <textarea rows={4} placeholder="Ej: Tengo 2 años sin declarar, empiezo empresa nueva, tengo multas pendientes..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/40 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/25 text-sm">
                  Solicitar diagnóstico gratuito →
                </button>
                <p className="text-center text-xs text-white/20">Tu información es confidencial. No compartimos datos con terceros.</p>
              </form>
            ) : (
              <div className="bg-teal-950/8 border border-teal-800/18 rounded-3xl p-12 text-center">
                <CheckCircle className="w-14 h-14 text-teal-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">¡Recibimos tu solicitud!</h3>
                <p className="text-white/45 mb-2">Un C.P. certificado revisará tu información y te contactará en menos de 48 horas con el diagnóstico completo.</p>
                <p className="text-xs text-white/25">Sin costo. Sin compromiso de contratación.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
