"use client"
import { useState } from "react"
import { Dumbbell, Star, CheckCircle, ChevronDown, MapPin, Phone, Clock, Zap, Users, Shield } from "lucide-react"
import { clases, horario, statsGimnasio } from "./data/clases"
import { membresias, entrenadores, testimoniosGimnasio } from "./data/membresias"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#clases", label: "Clases" },
  { href: "#membresias", label: "Membresías" },
  { href: "#entrenadores", label: "Entrenadores" },
  { href: "#horarios", label: "Horarios" },
  { href: "#contacto", label: "Contacto" },
]
const _theme = {
  iconFrom: "from-orange-600", iconTo: "to-red-700",
  accentText: "text-orange-400", accentBg: "bg-orange-600", accentHover: "hover:bg-orange-500",
  accentShadow: "shadow-orange-900/40", accentBorder: "border-orange-700/25",
  accentSubtext: "text-orange-500/60", accentPill: "bg-orange-900/20",
  mobileBg: "#0d0d0d", progressFrom: "from-orange-400", progressTo: "to-red-500",
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function GimnasioPage() {
  const [activeDay, setActiveDay] = useState("Lunes")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", membresia: "" })

  const faqs = [
    { q: "¿Puedo probar el gimnasio antes de contratar?", a: "Sí. Ofrecemos un día de prueba gratuito para que conozcas las instalaciones, tomes una clase y hablen con un coach. Sin compromiso de compra." },
    { q: "¿Hay contratos mínimos de permanencia?", a: "Tenemos membresías mensuales sin permanencia mínima. También ofrecemos planes trimestrales y anuales con hasta 20% de descuento. Puedes cancelar en cualquier momento con 15 días de aviso." },
    { q: "¿Tienen estacionamiento?", a: "Sí, contamos con estacionamiento propio gratuito para miembros con capacidad para 40 vehículos, disponible durante todo el horario de operación." },
    { q: "¿Cuándo puedo ver resultados?", a: "Los primeros cambios en fuerza y energía aparecen desde la semana 2-3. Cambios visuales notables en composición corporal generalmente en 8-12 semanas con consistencia y buena nutrición." },
    { q: "¿Tienen regaderas y área de descanso?", a: "Sí. Contamos con vestidores completos con regaderas, lockers y área de hidratación. Los miembros Elite tienen acceso a un área VIP de recuperación con crioterapia y sauna." },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">

      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "FORGE GYM" }} links={_navLinks} cta={{ href: "#contacto", label: "Prueba gratis" }} Icon={Dumbbell} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-orange-900/8 rounded-full blur-[130px]" />
          <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[110px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(234,88,12,0.04) 1px, transparent 0)", backgroundSize: "44px 44px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/25 border border-orange-700/25 text-orange-400 text-xs mb-8">
            <Zap className="w-3 h-3" /> Abierto hoy · 5:00 AM – 11:00 PM
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none max-w-4xl">
            <span className="text-white">Forja tu</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
              mejor versión
            </span>
            <br />
            <span className="text-white/30">sin excusas</span>
          </h1>
          <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
            Gimnasio premium con 38 clases semanales, entrenadores certificados y tecnología de seguimiento. Más de 1,200 miembros ya transformaron su cuerpo aquí.
          </p>
          <div className="flex items-center gap-4 flex-wrap mb-16">
            <a href="#membresias" className="px-8 py-4 font-bold rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white transition-all shadow-xl shadow-orange-900/30">
              Ver membresías
            </a>
            <a href="#clases" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
              Explorar clases
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsGimnasio.map(s => (
              <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-2xl font-black text-orange-400">{s.value}</div>
                <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="border-y border-white/[0.04] bg-white/[0.015] py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-xs text-white/25">
          {[
            { icon: Shield, text: "Entrenadores certificados NSCA / ISSA" },
            { icon: Zap, text: "Equipamiento Life Fitness & Rogue" },
            { icon: Users, text: "+1,200 miembros activos" },
            { icon: Clock, text: "Abierto todos los días del año" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-orange-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* CLASES */}
      <section id="clases" className="py-28 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Clases disponibles</h2>
            <p className="text-white/35 max-w-xl mx-auto">38 clases semanales en 6 disciplinas distintas. Siempre hay algo nuevo para hacer.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clases.map(c => {
              const Icon = c.icon
              return (
                <div key={c.id} className={`p-6 rounded-2xl border ${c.border} ${c.bg} hover:scale-[1.01] transition-all`}>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{c.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{c.desc}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full border ${c.border} ${c.color} ${c.bg}`}>{c.nivel}</span>
                    <span className="text-white/25">{c.duracion}</span>
                    <span className="text-white/25">·</span>
                    <span className="text-white/25">{c.capacidad}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HORARIO */}
      <section id="horarios" className="py-24 bg-[#111111]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Horario semanal</h2>
            <p className="text-white/35">Selecciona el día para ver las clases disponibles.</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {DAYS.map(day => (
              <button
                type="button"
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeDay === day ? "bg-orange-600 text-white" : "border border-white/10 text-white/35 hover:border-orange-700/40 hover:text-orange-400"}`}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(horario[activeDay] || []).map(([hora, clase]) => (
              <div key={`${hora}-${clase}`} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm font-black text-orange-400 w-14 shrink-0">{hora}</div>
                <div className="text-sm font-semibold text-white">{clase}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBRESÍAS */}
      <section id="membresias" className="py-28 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Planes y membresías</h2>
            <p className="text-white/35">Sin contratos de largo plazo. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {membresias.map(m => (
              <div key={m.name} className={`p-6 rounded-2xl border ${m.highlight ? "border-orange-500/40 bg-orange-950/15" : "border-white/[0.07] bg-white/[0.02]"} relative`}>
                {m.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    {m.badge}
                  </div>
                )}
                <h3 className={`text-xl font-black mb-1 ${m.color}`}>{m.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-white">${m.price.toLocaleString()}</span>
                  <span className="text-white/35 text-sm">{m.period}</span>
                </div>
                <p className="text-xs text-white/35 leading-relaxed mb-5">{m.desc}</p>
                <div className="space-y-2 mb-5">
                  {m.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-white/50">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                  {m.notIncluded.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-white/20 line-through">
                      <div className="w-3.5 h-3.5 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <a href="#contacto" className={`block w-full py-3 text-center text-sm font-bold rounded-xl transition-all ${m.ctaStyle}`}>
                  {m.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENTRENADORES */}
      <section id="entrenadores" className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros entrenadores</h2>
            <p className="text-white/35">Certificados internacionalmente, con experiencia comprobable y pasión por los resultados.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {entrenadores.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white mb-1">{t.name}</h3>
                <p className="text-xs text-orange-400/70 mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25 mb-1">{t.cert}</p>
                <p className="text-[11px] text-white/20">{t.exp} de experiencia</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Resultados reales</h2>
            <div className="flex items-center justify-center gap-2 text-orange-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-orange-400" />)}
              <span className="text-white/35 text-sm ml-2">4.8 · 640 reseñas Google</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimoniosGimnasio.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-400">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/25">{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-orange-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-28 bg-[#0d0d0d]">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Empieza hoy</h2>
            <p className="text-white/35">Primer día de prueba gratis. Sin tarjeta de crédito. Sin compromiso.</p>
          </div>
          <div className="bg-orange-950/12 border border-orange-800/18 rounded-3xl p-8">
            <div className="space-y-4">
              {[
                { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Tu nombre" },
                { key: "email", label: "Correo electrónico", type: "email", placeholder: "tu@correo.com" },
                { key: "telefono", label: "WhatsApp", type: "tel", placeholder: "+52 55 0000 0000" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-orange-600/45 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-orange-500/60 uppercase tracking-wider mb-2">Membresía de interés</label>
                <select value={form.membresia} onChange={e => setForm({ ...form, membresia: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-orange-800/25 rounded-xl text-white focus:outline-none focus:border-orange-600/45 text-sm">
                  <option value="" className="bg-[#0d0d0d]">Selecciona plan</option>
                  {["Básica ($699 MXN/mes)", "Premium ($1,299 MXN/mes)", "Elite ($2,199 MXN/mes)", "Aún no lo sé"].map(p => (
                    <option key={p} value={p} className="bg-[#0d0d0d]">{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white transition-all shadow-xl shadow-orange-900/30 text-sm">
              Quiero mi día de prueba gratis →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] bg-[#0a0a0a] py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-5 h-5 text-orange-500" />
              <span className="font-black text-white">FORGE GYM</span>
            </div>
            <p className="text-xs text-white/20 leading-relaxed">Gimnasio premium en CDMX. 8 años construyendo los mejores cuerpos y mentes de la ciudad.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-orange-600/60 uppercase tracking-wider mb-4">Contacto</h4>
            <div className="space-y-2 text-xs text-white/25">
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> +52 55 3344 5566</div>
              <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Insurgentes Sur 1236, CDMX</div>
              <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Lun–Vie 5:00–23:00 · Sáb–Dom 7:00–21:00</div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-orange-600/60 uppercase tracking-wider mb-4">Servicios</h4>
            <div className="space-y-1 text-xs text-white/25">
              {["Clases grupales", "Entrenamiento personalizado", "Nutrición", "Área libre", "Pilates Reformer"].map(s => <p key={s}>{s}</p>)}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/[0.04] pt-6 flex items-center justify-between text-[11px] text-white/15">
          <p>© 2025 Forge Gym · Todos los derechos reservados</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/40">Aviso de privacidad</a>
            <a href="#" className="hover:text-white/40">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
