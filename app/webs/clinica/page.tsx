"use client"
import { useState } from "react"
import { Star, Shield, Phone, MapPin, ChevronDown, Activity } from "lucide-react"
import { services, stats, insurances } from "./data/services"
import { doctors } from "./data/doctors"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#especialidades", label: "Especialidades" },
  { href: "#médicos", label: "Médicos" },
  { href: "#cómo-funciona", label: "Cómo funciona" },
  { href: "#seguros", label: "Seguros" },
  { href: "#cita", label: "Cita" },
]
const _theme = {
  iconFrom: "from-teal-600", iconTo: "to-cyan-800",
  accentText: "text-teal-400", accentBg: "bg-teal-600", accentHover: "hover:bg-teal-500",
  accentShadow: "shadow-teal-900/40", accentBorder: "border-teal-700/25",
  accentSubtext: "text-teal-500/60", accentPill: "bg-teal-900/20",
  mobileBg: "#020810", progressFrom: "from-teal-400", progressTo: "to-cyan-500",
}

const faqs = [
  { q: "¿Cómo agendo una cita?", a: "Puedes agendar en línea a través de nuestro formulario, llamarnos al +52 55 4000 0000 o visitarnos directamente. Confirmamos en menos de 2 horas." },
  { q: "¿Qué seguros médicos aceptan?", a: "Trabajamos con más de 15 aseguradoras incluyendo GNP, AXA, Allianz, Metlife, Bupa, Cigna, BBVA Salud y IMSS Voluntario." },
  { q: "¿Tienen servicio de urgencias 24 horas?", a: "Sí. Nuestro servicio de urgencias opera las 24 horas, los 365 días del año con médico de guardia especializado permanente." },
  { q: "¿Ofrecen consultas en línea?", a: "Sí. Teleconsulta disponible para seguimientos, resultados y especialidades seleccionadas. Misma calidad, desde cualquier lugar." },
  { q: "¿Cuánto tiempo espero para primera cita?", a: "Citas de primera vez disponibles en 24-48 horas para la mayoría de especialidades. Urgencias el mismo día." },
  { q: "¿Tienen estacionamiento?", a: "Estacionamiento gratuito para pacientes con validación en recepción. Capacidad para 120 vehículos en nuestras instalaciones." },
]

const steps = [
  { n: "01", title: "Agendar tu cita", desc: "Online, por teléfono o en recepción. Confirmación inmediata por WhatsApp." },
  { n: "02", title: "Consulta con especialista", desc: "Historia clínica completa, diagnóstico y plan de tratamiento personalizado." },
  { n: "03", title: "Diagnóstico & tratamiento", desc: "Estudios, laboratorio e imagen dentro de la misma clínica. Sin esperas externas." },
  { n: "04", title: "Seguimiento continuo", desc: "Expediente digital, teleconsulta de seguimiento y comunicación directa con tu médico." },
]

export default function ClinicaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [cita, setCita] = useState({ nombre: "", telefono: "", especialidad: "", fecha: "", mensaje: "" })

  return (
    <div className="min-h-screen bg-[#020810] text-white font-sans">
      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "HealthCore", sub: "Clínica & Especialidades" }} links={_navLinks} cta={{ href: "#cita", label: "Agendar cita" }} Icon={Activity} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,184,166,0.06) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-900/40 border border-teal-700/30 text-teal-300 text-xs mb-8">
              <Shield className="w-3 h-3" /> Certificación JCI · ISO 9001 · NOM-166
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              Tu salud merece
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">atención de clase</span>
              <br />
              <span className="text-white/70">mundial</span>
            </h1>
            <p className="text-xl text-white/40 leading-relaxed mb-10">
              85 especialistas certificados, tecnología de diagnóstico de última generación y atención personalizada desde el primer contacto hasta tu recuperación completa.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="#cita" className="px-8 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/50 text-sm">
                Agendar cita ahora
              </a>
              <a href="tel:+525540000000" className="px-8 py-4 font-bold rounded-xl border border-teal-700/40 text-teal-300 hover:bg-teal-900/30 transition-all text-sm">
                Urgencias: 5540-0000
              </a>
            </div>

            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-4 rounded-2xl border border-teal-900/30 bg-teal-950/20">
                  <div className="text-2xl font-black text-teal-400">{s.value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="py-24 bg-[#020810]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/30 border border-teal-800/30 text-teal-500 text-xs mb-4">8 especialidades disponibles</div>
            <h2 className="text-4xl font-black mb-3">Nuestras especialidades</h2>
            <p className="text-white/35 max-w-xl mx-auto">Atención médica de alta especialidad con tecnología de diagnóstico de punta y los mejores especialistas del país.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.name} className={`p-5 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.02] transition-all cursor-default group`}>
                  <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{s.name}</h3>
                  </div>
                  <span className={`text-[10px] font-semibold ${s.color} bg-black/20 px-2 py-0.5 rounded-full border ${s.border} mb-3 inline-block`}>{s.tag}</span>
                  <p className="text-xs text-white/35 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* MÉDICOS */}
      <section id="médicos" className="py-24 bg-gradient-to-b from-[#020810] to-[#030d15]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros especialistas</h2>
            <p className="text-white/35 max-w-xl mx-auto">Formados en las mejores instituciones del mundo. Certificados y con miles de casos exitosos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((d) => (
              <div key={d.name} className="p-5 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 hover:border-white/15 transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-lg font-black text-white shrink-0`}>
                    {d.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white">{d.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{d.specialty}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{d.sub}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1" style={{ color: d.accent }}>
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{d.rating}</span>
                    <span className="text-white/25">({d.reviews} reseñas)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${d.available ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/25"}`}>
                    {d.available ? "Disponible" : "Lista de espera"}
                  </span>
                </div>
                <p className="text-[11px] text-white/25 mt-3 border-t border-white/5 pt-3">{d.hospital}</p>
                {d.available && (
                  <button className="mt-4 w-full py-2 text-xs font-semibold rounded-xl bg-teal-600/20 border border-teal-500/20 text-teal-400 hover:bg-teal-600/30 transition-all">
                    Agendar con este médico
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="cómo-funciona" className="py-24 bg-[#030d15]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Cómo funciona</h2>
            <p className="text-white/35">Un proceso pensado para que tu única preocupación sea tu bienestar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-teal-500/30 to-transparent z-10" />
                )}
                <div className="p-5 rounded-2xl border border-teal-900/30 bg-teal-950/15">
                  <div className="text-3xl font-black text-teal-800/60 mb-3">{step.n}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGUROS */}
      <section id="seguros" className="py-20 bg-[#020810]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-3">Seguros médicos aceptados</h2>
          <p className="text-white/35 mb-10 text-sm">Trabajamos directamente con tu aseguradora. Sin anticipos, sin papeleo complicado.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {insurances.map((ins) => (
              <div key={ins} className="px-5 py-2.5 rounded-xl border border-teal-900/30 bg-teal-950/15 text-sm text-white/40 hover:text-teal-300 hover:border-teal-700/40 transition-all">
                {ins}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDAR CITA */}
      <section id="cita" className="py-24 bg-gradient-to-b from-[#020810] to-[#040d1a]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Agendar cita</h2>
            <p className="text-white/35">Completa el formulario y te confirmaremos en menos de 2 horas.</p>
          </div>
          <div className="bg-teal-950/20 border border-teal-800/30 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Tu nombre" },
                { key: "telefono", label: "Teléfono / WhatsApp", type: "tel", placeholder: "+52 55 0000 0000" },
                { key: "fecha", label: "Fecha preferida", type: "date", placeholder: "" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-teal-400/70 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={cita[key as keyof typeof cita]}
                    onChange={(e) => setCita({ ...cita, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-teal-800/40 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-500/50 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-teal-400/70 uppercase tracking-wider mb-2">Especialidad</label>
                <select value={cita.especialidad} onChange={(e) => setCita({ ...cita, especialidad: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-teal-800/40 rounded-xl text-white focus:outline-none focus:border-teal-500/50 text-sm">
                  <option value="" className="bg-[#020810]">Seleccionar especialidad</option>
                  {["Cardiología","Neurología","Oftalmología","Pediatría","Ortopedia","Medicina Interna","Medicina Preventiva","Genética"].map(s => (
                    <option key={s} value={s} className="bg-[#020810]">{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-teal-400/70 uppercase tracking-wider mb-2">Motivo de consulta</label>
                <textarea value={cita.mensaje} onChange={(e) => setCita({ ...cita, mensaje: e.target.value })}
                  placeholder="Describe brevemente tus síntomas o motivo de consulta..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/30 border border-teal-800/40 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-teal-500/50 text-sm resize-none"
                />
              </div>
            </div>
            <button className="w-full mt-5 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xl shadow-teal-900/40 text-sm">
              Solicitar cita
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[#020810]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-teal-900/30 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/80">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-white/40 leading-relaxed border-t border-teal-900/20 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-teal-900/20 bg-[#010a10] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-white/40">HealthCore</span>
            <span>· Clínica & Especialidades · Urgencias 24h</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Insurgentes Sur 1602, CDMX</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 5540-0000</span>
          </div>
          <p>© 2025 HealthCore · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}
