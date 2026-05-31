"use client"
import { useState } from "react"
import { CheckCircle, Zap, ChevronDown } from "lucide-react"
import { services, stats, clients } from "./data/services"
import { portfolio } from "./data/portfolio"
import { plans } from "./data/pricing"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#proceso", label: "Proceso" },
  { href: "#equipo", label: "Equipo" },
  { href: "#precios", label: "Precios" },
]
const _theme = {
  iconFrom: "from-violet-600", iconTo: "to-pink-700",
  accentText: "text-violet-400", accentBg: "bg-violet-600", accentHover: "hover:bg-violet-500",
  accentShadow: "shadow-violet-900/40", accentBorder: "border-violet-700/25",
  accentSubtext: "text-violet-400/60", accentPill: "bg-violet-900/20",
  mobileBg: "#050408", progressFrom: "from-violet-400", progressTo: "to-pink-500",
}

const team = [
  { name: "Ricardo Mendoza", role: "CEO & Estrategia Digital", exp: "14 años · Ex-Google México", avatar: "RM", color: "from-violet-600 to-purple-800" },
  { name: "Valentina Ríos", role: "Head of Design & UX", exp: "11 años · Ex-Figma", avatar: "VR", color: "from-pink-600 to-rose-800" },
  { name: "Alejandro Cruz", role: "Lead Engineer", exp: "10 años · Full-stack & Cloud", avatar: "AC", color: "from-indigo-600 to-blue-800" },
  { name: "Fernanda López", role: "Performance & Growth", exp: "9 años · $180M en ad spend", avatar: "FL", color: "from-amber-600 to-orange-800" },
]

const processSteps = [
  { n: "01", title: "Discovery", desc: "Auditoría profunda de tu negocio, competidores, mercado y stack actual. Definimos el norte estratégico juntos." },
  { n: "02", title: "Estrategia", desc: "Roadmap priorizado con métricas claras (KPIs, OKRs). Sin ambigüedad de qué hacemos, cuándo y por qué." },
  { n: "03", title: "Ejecución", desc: "Sprints de 2 semanas con entregables concretos. Transparencia total: dashboard en tiempo real de avance." },
  { n: "04", title: "Optimización", desc: "Análisis continuo de datos, A/B testing y mejoras iterativas para maximizar tu ROI mes a mes." },
  { n: "05", title: "Escala", desc: "Una vez validado el modelo, aceleramos la inversión en los canales que demuestran mayor retorno." },
]

export default function AgenciaPage() {
  const [activePortfolio, setActivePortfolio] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contacto, setContacto] = useState({ empresa: "", nombre: "", email: "", servicio: "", presupuesto: "" })

  const faqs = [
    { q: "¿Cuánto tiempo para ver resultados?", a: "Depende del canal. SEO muestra primeros resultados en 3-6 meses; campañas de pago desde la primera semana. Siempre te decimos qué esperar antes de empezar." },
    { q: "¿Tienen contratos mínimos?", a: "Sí, trabajamos con contratos mínimos de 3 meses para que nuestra estrategia tenga tiempo de generar resultados. A partir del mes 4, contratos mensuales." },
    { q: "¿Trabajan con empresas pequeñas?", a: "Nuestro plan Starter está diseñado para PyMEs. El presupuesto mínimo recomendado para campañas de pago es $30,000 MXN/mes para obtener resultados estadísticamente significativos." },
    { q: "¿Qué incluye el reporte mensual?", a: "Dashboard en tiempo real + reporte ejecutivo mensual con: métricas clave, comparativa vs período anterior, insights accionables y plan del siguiente mes." },
    { q: "¿Puedo cancelar en cualquier momento?", a: "Al cumplir el mínimo inicial, los contratos son mensuales con 30 días de aviso. Sin penalizaciones ni cargos escondidos." },
  ]

  return (
    <div className="min-h-screen bg-[#050408] text-white font-sans">
      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "Nexus Agency" }} links={_navLinks} cta={{ href: "#contacto", label: "Consulta gratis" }} Icon={Zap} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-pink-600/6 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.04) 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/30 border border-violet-700/30 text-violet-300 text-xs mb-8">
            <Zap className="w-3 h-3" /> Agencia digital full-service · 340+ proyectos entregados
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">Hacemos crecer</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              tu negocio digital
            </span>
            <br />
            <span className="text-white/40">con resultados medibles</span>
          </h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto leading-relaxed mb-12">
            Estrategia, diseño, desarrollo y performance en una sola agencia. Obsesionados con el ROI de cada peso que inviertes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            <a href="#contacto" className="px-8 py-4 font-bold rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white transition-all shadow-xl shadow-violet-900/30">
              Consulta estratégica gratis
            </a>
            <a href="#portfolio" className="px-8 py-4 font-bold rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all">
              Ver casos de éxito
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="p-4 rounded-2xl border border-white/7 bg-white/2">
                <div className="text-2xl font-black text-violet-400">{s.value}</div>
                <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 bg-[#050408]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Servicios que escalan tu empresa</h2>
            <p className="text-white/35 max-w-xl mx-auto">De la estrategia a la ejecución. Todo bajo un mismo techo, con responsabilidad total por los resultados.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => {
              const Icon = s.icon
              return (
                <div key={s.name} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all group cursor-default`}>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.tags.map(tag => (
                      <span key={tag} className={`px-2 py-0.5 text-[10px] rounded-full ${s.bg} ${s.color} border ${s.border}`}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className={`text-sm font-bold ${s.color}`}>{s.price}</span>
                    <span className="text-[11px] text-white/25">{s.results}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="py-24 bg-gradient-to-b from-[#050408] to-[#070509]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Casos de éxito reales</h2>
            <p className="text-white/35">Resultados medibles para empresas reales. Sin humo ni promesas vacías.</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {portfolio.map((p, i) => (
              <button key={p.client} onClick={() => setActivePortfolio(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activePortfolio === i ? "bg-violet-600 text-white" : "border border-white/10 text-white/35 hover:border-violet-700/40 hover:text-violet-400"}`}>
                {p.category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolio.map((p, i) => (
              <div key={p.client} onClick={() => setActivePortfolio(i)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${activePortfolio === i ? "border-violet-500/40 bg-violet-950/20 scale-[1.01]" : "border-white/7 bg-white/2 hover:bg-white/4 hover:border-white/15"}`}>
                <div className={`h-2 rounded-full bg-gradient-to-r ${p.color} mb-4 opacity-70`} />
                <div className="text-[10px] text-white/25 tracking-widest uppercase mb-1">{p.category}</div>
                <h3 className="font-bold text-white mb-1">{p.title}</h3>
                <p className="text-xs text-white/30 mb-1 font-medium">{p.client}</p>
                <p className="text-xs text-white/25 leading-relaxed mb-4">{p.desc}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {p.metrics.map(m => (
                    <div key={m.label} className="text-center p-2 rounded-lg bg-black/20 border border-white/5">
                      <div className="text-sm font-black" style={{ color: p.accent }}>{m.value}</div>
                      <div className="text-[9px] text-white/25 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/30">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section id="proceso" className="py-24 bg-[#050408]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestro proceso</h2>
            <p className="text-white/35">5 fases probadas. Cero improvisación. Máximo impacto.</p>
          </div>
          <div className="space-y-4">
            {processSteps.map((s) => (
              <div key={s.n} className="flex gap-6 items-start p-6 rounded-2xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.03] transition-all">
                <div className="text-3xl font-black text-violet-900/60 w-12 shrink-0">{s.n}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo" className="py-24 bg-gradient-to-b from-[#050408] to-[#060509]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">El equipo detrás de los resultados</h2>
            <p className="text-white/35">Expertos formados en las mejores empresas del mundo. Con piel en el juego.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 transition-all text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {t.avatar}
                </div>
                <h3 className="font-bold text-white mb-1">{t.name}</h3>
                <p className="text-xs text-violet-400/70 mb-1">{t.role}</p>
                <p className="text-[11px] text-white/25">{t.exp}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTES */}
      <section className="py-16 bg-[#050408] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-white/25 uppercase tracking-widest mb-8">Empresas que han confiado en nosotros</p>
          <div className="flex flex-wrap justify-center gap-3">
            {clients.map(c => (
              <div key={c} className="px-4 py-2 rounded-xl border border-white/7 bg-white/2 text-sm text-white/25 hover:text-white/50 hover:border-white/15 transition-all">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-24 bg-[#060509]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Planes transparentes</h2>
            <p className="text-white/35">Sin costos ocultos. Sin sorpresas. Todo en una mensualidad fija.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map(p => (
              <div key={p.name} className={`p-6 rounded-2xl border ${p.highlight ? "border-violet-500/40 bg-violet-950/20" : "border-white/7 bg-white/2"} relative`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-violet-600 text-white">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {p.price > 0 ? (
                    <>
                      <span className="text-3xl font-black text-white">${p.price.toLocaleString()}</span>
                      <span className="text-white/35 text-sm">{p.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-white">{p.period}</span>
                  )}
                </div>
                <p className="text-xs text-white/35 leading-relaxed mb-5">{p.desc}</p>
                <div className="space-y-2 mb-5">
                  {p.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-white/50">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                  {p.notIncluded.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-white/20 line-through">
                      <div className="w-3.5 h-3.5 shrink-0" />{f}
                    </div>
                  ))}
                </div>
                <a href="#contacto" className={`block w-full py-3 text-center text-sm font-bold rounded-xl transition-all ${p.ctaStyle}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#050408]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-24 bg-gradient-to-b from-[#050408] to-[#080510]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Hagamos crecer tu empresa</h2>
            <p className="text-white/35">Cuéntanos tu proyecto. En 24h tendrás una propuesta estratégica personalizada. Gratis.</p>
          </div>
          <div className="bg-violet-950/15 border border-violet-800/20 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "empresa", label: "Empresa", type: "text", placeholder: "Nombre de tu empresa" },
                { key: "nombre", label: "Tu nombre", type: "text", placeholder: "Nombre completo" },
                { key: "email", label: "Email de trabajo", type: "email", placeholder: "tu@empresa.com" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-violet-400/60 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={contacto[key as keyof typeof contacto]}
                    onChange={e => setContacto({ ...contacto, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-violet-800/30 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-violet-400/60 uppercase tracking-wider mb-2">Servicio de interés</label>
                <select value={contacto.servicio} onChange={e => setContacto({ ...contacto, servicio: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-violet-800/30 rounded-xl text-white focus:outline-none focus:border-violet-500/50 text-sm">
                  <option value="" className="bg-[#050408]">¿Qué necesitas?</option>
                  {["Desarrollo Web/App","SEO","Google/Meta Ads","Social Media","App Móvil","Analytics","Todo lo anterior"].map(s => (
                    <option key={s} value={s} className="bg-[#050408]">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-violet-400/60 uppercase tracking-wider mb-2">Presupuesto mensual</label>
                <select value={contacto.presupuesto} onChange={e => setContacto({ ...contacto, presupuesto: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-violet-800/30 rounded-xl text-white focus:outline-none focus:border-violet-500/50 text-sm">
                  <option value="" className="bg-[#050408]">Rango de inversión</option>
                  {["$10k – $25k MXN/mes","$25k – $50k MXN/mes","$50k – $100k MXN/mes","$100k+ MXN/mes","Proyecto único"].map(p => (
                    <option key={p} value={p} className="bg-[#050408]">{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="w-full mt-5 py-4 font-bold rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white transition-all shadow-xl shadow-violet-900/30 text-sm">
              Solicitar propuesta gratuita →
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] bg-[#040307] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-[10px] font-black text-white">N</div>
            <span className="text-white/40 font-bold">Nexus Agency</span>
            <span>· Agencia Digital Full-Service</span>
          </div>
          <p>© 2025 Nexus Agency · Todos los derechos reservados · Ciudad de México</p>
        </div>
      </footer>
    </div>
  )
}
