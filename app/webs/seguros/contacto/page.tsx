"use client"
import { useState } from "react"
import { Phone, Mail, MapPin, Clock, CheckCircle, Shield } from "lucide-react"
import { brand } from "../data/index"

export default function SegurosContacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", tipo: "", empresa: "", mensaje: "" })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#06090f]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-blue-900/5 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700/25 text-blue-400 text-xs mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Asesor disponible
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Obtén tu</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">cotización gratuita</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">
            Completa el formulario y recibe una comparativa de +12 aseguradoras en menos de 24 horas.
          </p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {sent ? (
              <div className="p-12 rounded-3xl border border-blue-800/25 bg-blue-950/15 text-center">
                <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">¡Solicitud recibida!</h2>
                <p className="text-white/40 leading-relaxed">Un especialista revisará tu caso y te enviará una comparativa completa en menos de 24 horas. Revisa tu correo y WhatsApp.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-blue-950/12 border border-blue-800/18 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6">Cuéntanos qué necesitas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">Nombre completo</label>
                    <input required type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                    <input required type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                    <input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">Tipo de seguro</label>
                    <select aria-label="Tipo de seguro" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white focus:outline-none focus:border-blue-600/45 text-sm">
                      <option value="" className="bg-[#06090f]">Selecciona el tipo de seguro</option>
                      {["Seguro de vida", "Gastos médicos mayores", "Seguro de auto", "Seguro empresarial", "Seguro de hogar", "Retiro y ahorro", "Revisar mis pólizas actuales", "Otro"].map(o => (
                        <option key={o} value={o} className="bg-[#06090f]">{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">¿Es para empresa? (opcional)</label>
                    <input type="text" placeholder="Nombre de la empresa y número de empleados" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-blue-500/60 uppercase tracking-wider mb-2">Información adicional</label>
                    <textarea rows={4} placeholder="Edad, suma asegurada deseada, cobertura actual, etc." value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/25 text-sm tracking-wide">
                  Solicitar cotización gratuita →
                </button>
                <p className="text-center text-xs text-white/20 mt-4">Tus datos están protegidos. No compartimos información con terceros.</p>
              </form>
            )}
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-blue-800/20 bg-blue-950/10">
              <h3 className="font-bold text-white mb-4">Contacto directo</h3>
              <div className="space-y-3 text-sm text-white/40">
                <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-blue-600/60 shrink-0 mt-0.5" /> {brand.phone}</div>
                <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-blue-600/60 shrink-0 mt-0.5" /> {brand.email}</div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-blue-600/60 shrink-0 mt-0.5" /> {brand.address}</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-blue-600/60" /> <h3 className="font-bold text-white text-sm">Tiempos de respuesta</h3></div>
              <div className="space-y-2 text-xs text-white/35">
                <div className="flex justify-between"><span>Cotización individual</span> <span className="text-white/55">{'< 2 horas'}</span></div>
                <div className="flex justify-between"><span>Cotización empresarial</span> <span className="text-white/55">24 horas</span></div>
                <div className="flex justify-between"><span>Revisión de pólizas</span> <span className="text-white/55">48 horas</span></div>
                <div className="flex justify-between"><span>Gestión de siniestros</span> <span className="text-blue-500/70">Inmediata</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500/60" /> Nuestra garantía</h3>
              <div className="space-y-2 text-xs text-white/35">
                {["Cotización completamente gratis", "Sin compromiso de contratación", "Comparativa multi-aseguradora", "Asesor dedicado para siempre", "Gestión de siniestros incluida"].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-blue-600/50 shrink-0" /> {item}
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
