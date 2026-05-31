"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, Building2 } from "lucide-react"
import { brand } from "../data/index"

export default function InmobiliariaContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", operacion: "", tipo: "", zona: "", presupuesto: "", mensaje: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  return (
    <div className="min-h-screen bg-[#0d0a04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-amber-900/6 rounded-full blur-[100px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Agentes disponibles
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Encuentra tu</span>
            <br /><span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">propiedad ideal</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Cuéntanos qué buscas y asignamos al agente especializado en tu zona y tipo de propiedad. Sin costo para el comprador.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-amber-800/25 bg-amber-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Solicitud recibida!</h2>
                <p className="text-white/40">Un agente especializado en tu zona te contactará en menos de 2 horas hábiles.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-amber-950/12 border border-amber-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">¿Qué estás buscando?</h2>
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
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Tipo de operación</label>
                    <select aria-label="Operación" value={form.operacion} onChange={e => setForm({...form, operacion: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0d0a04]">Selecciona</option>
                      {["Comprar","Vender","Rentar","Invertir","Valuación"].map(o => <option key={o} value={o} className="bg-[#0d0a04]">{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Tipo de propiedad</label>
                    <select aria-label="Tipo" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0d0a04]">Selecciona</option>
                      {["Departamento","Casa","Penthouse","Local Comercial","Oficina","Terreno","Nave Industrial"].map(t => <option key={t} value={t} className="bg-[#0d0a04]">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Zona de interés</label>
                    <input type="text" placeholder="Polanco, Lomas, Santa Fe..." value={form.zona} onChange={e => setForm({...form, zona: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Presupuesto aproximado</label>
                    <select aria-label="Presupuesto" value={form.presupuesto} onChange={e => setForm({...form, presupuesto: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white focus:outline-none focus:border-amber-600/45 text-sm">
                      <option value="" className="bg-[#0d0a04]">Selecciona rango</option>
                      {["Menos de $2M MXN","$2M–$5M MXN","$5M–$10M MXN","$10M–$20M MXN","Más de $20M MXN","Renta mensual"].map(p => <option key={p} value={p} className="bg-[#0d0a04]">{p}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-amber-500/60 uppercase tracking-wider mb-2">Características deseadas</label>
                    <textarea rows={3} placeholder="Número de recámaras, cajones, amenidades, orientación, vista..." value={form.mensaje} onChange={e => setForm({...form, mensaje: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-amber-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/25 text-sm">
                  Solicitar asesoría sin costo →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Respuesta en 2 horas hábiles · La asesoría para compradores es gratuita</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-amber-800/20 bg-amber-950/10">
              <h3 className="font-bold text-white mb-4">Contacto directo</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-amber-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-amber-600/60" /> <h3 className="font-bold text-white text-sm">Horarios</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Lunes – Viernes</span><span className="text-white/55">9:00 – 19:00</span></div>
                <div className="flex justify-between"><span>Sábado</span><span className="text-white/55">10:00 – 15:00</span></div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-500/60" /> Por qué elegirnos</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Asesoría gratuita para compradores","Verificación jurídica incluida","Red de +2,000 compradores activos","Coordinación notarial completa","15 años en el mercado de CDMX"].map(item => (
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
