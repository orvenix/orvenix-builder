"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, Dumbbell } from "lucide-react"
import { brand, membresias } from "../data/index"

export default function GimnasioContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", plan: "", objetivo: "", horario: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#0f0804]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-orange-900/8 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/20 border border-orange-700/25 text-orange-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> Prueba gratis disponible
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Elige tu</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">membresía</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">7 días gratis sin tarjeta de crédito. Después elige el plan que más te conviene.</p>
        </div>
      </section>

      {/* Planes */}
      <section className="pb-16 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {membresias.map(m => (
            <div key={m.name} className={`p-6 rounded-2xl border transition-all ${m.featured ? "border-orange-600/40 bg-orange-950/20 scale-[1.02]" : "border-white/[0.08] bg-white/[0.02]"}`}>
              {m.featured && <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">⭐ Más popular</div>}
              <h3 className={`text-xl font-black mb-0.5 ${m.featured ? "text-orange-300" : "text-white"}`}>{m.name}</h3>
              <p className="text-xs text-white/30 mb-3">{m.desc}</p>
              <p className={`text-3xl font-black mb-4 ${m.color}`}>{m.price}<span className="text-base font-normal text-white/30">{m.period}</span></p>
              <ul className="space-y-2 mb-6">
                {m.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-white/40"><CheckCircle className="w-3.5 h-3.5 text-orange-500/60 shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <button type="button" onClick={() => { setSent(false); document.getElementById("form-section")?.scrollIntoView({behavior:"smooth"}) }}
                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${m.featured ? "bg-orange-600 hover:bg-orange-500 text-white" : "border border-white/10 text-white/60 hover:bg-white/[0.05]"}`}>
                {m.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="form-section" className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-orange-800/25 bg-orange-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-orange-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Solicitud recibida!</h2>
                <p className="text-white/40">Te contactamos en menos de 24 horas para activar tu prueba gratuita. ¡Prepárate para empezar!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-orange-950/12 border border-orange-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Solicitar prueba gratuita de 7 días</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Correo</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Plan de interés</label>
                    <select aria-label="Plan" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white focus:outline-none focus:border-orange-600/45 text-sm">
                      <option value="" className="bg-[#0f0804]">Selecciona plan</option>
                      {membresias.map(m => <option key={m.name} value={m.name} className="bg-[#0f0804]">{m.name} — {m.price}/mes</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Horario preferido</label>
                    <select aria-label="Horario" value={form.horario} onChange={e => setForm({...form, horario: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white focus:outline-none focus:border-orange-600/45 text-sm">
                      <option value="" className="bg-[#0f0804]">¿Cuándo vas al gym?</option>
                      {["Mañana (6–9am)", "Mediodía (10am–13pm)", "Tarde (14–17pm)", "Noche (18–21pm)", "Variable"].map(h => <option key={h} value={h} className="bg-[#0f0804]">{h}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">¿Cuál es tu objetivo principal?</label>
                    <input type="text" placeholder="Perder peso, ganar músculo, mejorar condición, competir..." value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/45 text-sm" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/25 text-sm">
                  Activar 7 días gratis →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Sin tarjeta de crédito · Sin compromiso · Cancelación gratuita</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-orange-800/20 bg-orange-950/10">
              <h3 className="font-bold text-white mb-4">Contacto</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-orange-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-orange-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-orange-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-orange-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Plan Básica</span><span className="text-white/55">6:00 – 22:00</span></div>
                <div className="flex justify-between"><span className="text-orange-400/70">Plan Premium / Elite</span><span className="text-orange-400/70">24 / 7</span></div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><Dumbbell className="w-4 h-4 text-orange-500/60" /> Incluye en la prueba</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Acceso completo al gym","Clases grupales disponibles","Evaluación inicial con coach","App de seguimiento activada","Casillero durante la prueba"].map(item => (
                  <div key={item} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-orange-600/50 shrink-0" /> {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
