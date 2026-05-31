"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { brand, especialidades } from "../data/index"

export default function ClinicaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", especialidad: "", motivo: "", fecha: "", seguro: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#03100f]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-teal-900/6 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/20 border border-teal-700/25 text-teal-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> Citas disponibles
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Agenda</span>{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">tu cita</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Confirmamos en menos de 24 horas. Para urgencias, llama directamente al {brand.urgencias}.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Urgencias banner */}
            <div className="mb-6 p-4 rounded-2xl border border-red-700/30 bg-red-950/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-300">¿Urgencia médica?</p>
                <p className="text-xs text-white/40 mt-0.5">Llama al <span className="text-red-300 font-bold">{brand.urgencias}</span> — Atención 24/7 los 365 días del año.</p>
              </div>
            </div>

            {sent ? (
              <div className="p-12 rounded-3xl border border-teal-800/25 bg-teal-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Cita solicitada!</h2>
                <p className="text-white/40">Confirmaremos tu cita por correo y WhatsApp en menos de 24 horas hábiles.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-teal-950/12 border border-teal-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Solicitar cita médica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Correo</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Especialidad</label>
                    <select aria-label="Especialidad" value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white focus:outline-none focus:border-teal-600/45 text-sm">
                      <option value="" className="bg-[#03100f]">Selecciona especialidad</option>
                      {especialidades.map(e => <option key={e.name} value={e.name} className="bg-[#03100f]">{e.name}</option>)}
                      <option value="no-se" className="bg-[#03100f]">No sé cuál necesito</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Seguro médico (opcional)</label>
                    <input type="text" placeholder="GNP, AXA, Allianz..." value={form.seguro} onChange={e => setForm({...form, seguro: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Fecha preferida</label>
                    <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white focus:outline-none focus:border-teal-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-teal-500/60 uppercase tracking-wider mb-2">Motivo de la consulta</label>
                    <textarea rows={3} placeholder="Describe brevemente tus síntomas o el motivo de la consulta..." value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-teal-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/25 text-sm">
                  Solicitar cita →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Confirmación en menos de 24 horas hábiles · Tu información es confidencial</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-teal-800/20 bg-teal-950/10">
              <h3 className="font-bold text-white mb-4">Contacto</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-teal-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-teal-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-teal-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-teal-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Viernes</span><span className="text-white/55">7:00 – 20:00</span></div>
                <div className="flex justify-between"><span>Sábado</span><span className="text-white/55">8:00 – 15:00</span></div>
                <div className="flex justify-between"><span className="text-red-400/70">Urgencias</span><span className="text-red-400/70">24/7 · 365 días</span></div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm">¿Por qué elegirnos?</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Médicos certificados con cédula verificada","Más de 10 seguros médicos aceptados","Laboratorio e imagen en el mismo lugar","Expediente electrónico accesible en línea","Estacionamiento propio sin costo"].map(item => (
                  <div key={item} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-teal-600/50 shrink-0" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
