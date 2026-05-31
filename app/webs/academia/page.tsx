"use client"
import { useState } from "react"
import { Star, Clock, Users, BookOpen, Play, CheckCircle, ChevronDown, Award, TrendingUp, Zap, GraduationCap } from "lucide-react"
import { courses, categories, stats } from "./data/courses"
import { instructors, pricingPlans } from "./data/instructors"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#cursos", label: "Cursos" },
  { href: "#rutas", label: "Rutas" },
  { href: "#instructores", label: "Instructores" },
  { href: "#precios", label: "Precios" },
  { href: "#empresas", label: "Empresas" },
]
const _theme = {
  iconFrom: "from-indigo-600", iconTo: "to-violet-700",
  accentText: "text-indigo-400", accentBg: "bg-indigo-600", accentHover: "hover:bg-indigo-500",
  accentShadow: "shadow-indigo-900/40", accentBorder: "border-indigo-700/25",
  accentSubtext: "text-indigo-400/60", accentPill: "bg-indigo-900/20",
  mobileBg: "#040608", progressFrom: "from-indigo-400", progressTo: "to-violet-500",
}

const howItWorks = [
  { n: "01", icon: BookOpen, title: "Elige tu curso", desc: "231 cursos actualizados. Filtra por nivel, categoría o instructor. Previsualiza las primeras lecciones gratis." },
  { n: "02", icon: Play, title: "Aprende a tu ritmo", desc: "Videos en HD, recursos descargables, código fuente y ejercicios prácticos. Desde cualquier dispositivo." },
  { n: "03", icon: Users, title: "Practica con proyectos reales", desc: "Cada curso tiene proyectos que puedes agregar a tu portafolio. Feedback de instructores certificados." },
  { n: "04", icon: Award, title: "Certifícate y aplica", desc: "Certificados verificables por blockchain. Reconocidos por más de 500 empresas en México y Latinoamérica." },
]

const learningPaths = [
  {
    name: "Full-Stack Developer",
    desc: "De cero a conseguir tu primer empleo como desarrollador web en 6 meses.",
    courses: ["HTML/CSS Pro", "JavaScript Avanzado", "React & Next.js", "Node.js & APIs", "Bases de datos", "Deploy & DevOps"],
    duration: "6 meses",
    level: "Principiante → Profesional",
    salary: "$25,000 – $60,000 MXN/mes",
    color: "from-indigo-600 to-violet-800",
    accent: "#6366f1",
  },
  {
    name: "AI Product Builder",
    desc: "Construye productos con inteligencia artificial. El perfil más demandado de 2025.",
    courses: ["Python para IA", "Claude & OpenAI API", "Prompt Engineering", "RAG & Embeddings", "Agentes IA", "Deploy IA apps"],
    duration: "4 meses",
    level: "Intermedio → Avanzado",
    salary: "$45,000 – $120,000 MXN/mes",
    color: "from-violet-600 to-pink-800",
    accent: "#7c3aed",
  },
  {
    name: "Digital Marketing Master",
    desc: "Conviértete en el perfil de marketing más completo del mercado latinoamericano.",
    courses: ["Google Ads", "Meta Ads Avanzado", "SEO Técnico", "Email Marketing", "Analytics GA4", "Growth Hacking"],
    duration: "3 meses",
    level: "Principiante → Senior",
    salary: "$18,000 – $55,000 MXN/mes",
    color: "from-amber-500 to-orange-800",
    accent: "#f59e0b",
  },
]

const testimonials = [
  { name: "Luis García", role: "Frontend Dev @ Clip", text: "En 5 meses con el path Full-Stack conseguí mi primer trabajo como developer. El curso de Next.js de Carlos es increíblemente completo.", avatar: "LG", salary: "Aumentó su salario 3x", color: "text-indigo-400" },
  { name: "Ana Pedraza", role: "AI Engineer @ Startup", text: "El curso de Claude API me dio el boost que necesitaba para pasar de data scientist a AI Engineer. Los proyectos del curso son aplicables de inmediato.", avatar: "AP", salary: "Conseguiu oferta en 2 meses", color: "text-violet-400" },
  { name: "Marco Rivas", role: "Growth Manager @ OXXO", text: "El path de Digital Marketing cambió mi carrera. De no saber nada de ads a manejar $5M MXN/mes en campañas para una empresa líder.", avatar: "MR", salary: "+180% salario", color: "text-amber-400" },
]

export default function AcademiaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState("Todos")

  const faqs = [
    { q: "¿Los cursos tienen fecha límite?", a: "No. Una vez que compras un curso o activas Pro, tienes acceso de por vida (cursos individuales) o mientras mantengas tu suscripción activa." },
    { q: "¿En qué idioma están los cursos?", a: "Todos los cursos están en español latinoamericano, con subtítulos disponibles. Material complementario en inglés para prepararte para el mercado global." },
    { q: "¿Los certificados son válidos en empresas?", a: "Sí. Trabajamos con +500 empresas en LATAM que reconocen y solicitan nuestras certificaciones. Los certificados son verificables online y en LinkedIn." },
    { q: "¿Qué pasa si no me gusta un curso?", a: "Garantía de reembolso de 30 días sin preguntas para cursos individuales. Para Pro, puedes cancelar en cualquier momento." },
    { q: "¿Hay descuentos para equipos o empresas?", a: "Sí. El plan Business incluye usuarios ilimitados con panel de administración. Contacta a ventas para un plan personalizado según el tamaño de tu equipo." },
  ]

  return (
    <div className="min-h-screen bg-[#040608] text-white font-sans">
      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "SkillForge", sub: "Academia Pro" }} links={_navLinks} cta={{ href: "#precios", label: "Empezar gratis" }} Icon={GraduationCap} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[700px] h-[500px] bg-indigo-600/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/5 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-700/30 text-indigo-300 text-xs mb-8">
              <Zap className="w-3 h-3" /> 215,000+ estudiantes en LATAM
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              <span className="text-white">El futuro pertenece</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                a quienes aprenden
              </span>
              <br />
              <span className="text-white/40">más rápido</span>
            </h1>
            <p className="text-xl text-white/35 leading-relaxed mb-10">
              231 cursos de las habilidades más demandadas del mercado. Instructores que trabajan en las empresas más grandes del mundo. Resultados que hablan por sí solos.
            </p>
            <div className="flex gap-4 flex-wrap mb-14">
              <a href="#precios" className="px-8 py-4 font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all shadow-xl shadow-indigo-900/30">
                7 días gratis con Pro
              </a>
              <a href="#cursos" className="px-8 py-4 font-bold rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/25 transition-all">
                Explorar cursos
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-indigo-900/30 bg-indigo-950/15">
                  <div className="text-2xl font-black text-indigo-400">{s.value}</div>
                  <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section id="categorías" className="py-16 bg-[#040608] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {[{ name: "Todos", count: 231, icon: "🔥", color: "text-white" }, ...categories].map(c => (
              <button key={c.name} onClick={() => setActiveCategory(c.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${activeCategory === c.name ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300" : "border border-white/7 text-white/35 hover:border-white/15 hover:text-white/55"}`}>
                <span>{c.icon}</span>
                <span className="font-medium">{c.name}</span>
                <span className={`text-xs ${activeCategory === c.name ? "text-indigo-400/60" : "text-white/20"}`}>{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CURSOS */}
      <section id="cursos" className="py-24 bg-[#040608]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-4xl font-black mb-2">Cursos más populares</h2>
              <p className="text-white/35">Actualizados cada trimestre. Basados en las habilidades que demanda el mercado.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(activeCategory === "Todos" ? courses : courses.filter(c => c.category === activeCategory)).map(c => (
              <div key={c.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all overflow-hidden group">
                {/* Thumbnail */}
                <div className={`h-36 bg-gradient-to-br ${c.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
                  <div className="relative text-center px-4">
                    <div className="text-2xl mb-1">{categories.find(cat => cat.name === c.category)?.icon || "📚"}</div>
                    <div className="text-xs text-white/70">{c.category}</div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c.tagColor} border border-current/20`}>{c.tag}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-[10px] text-white/30 mb-1">{c.category} · {c.level}</div>
                  <h3 className="font-bold text-white mb-1 leading-snug">{c.title}</h3>
                  <p className="text-xs text-white/30 mb-3">por {c.instructor}</p>

                  <div className="flex items-center gap-3 text-xs text-white/25 mb-4">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400 font-bold">{c.rating}</span> ({c.reviews.toLocaleString()})</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.lessons} lecciones</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-white">${c.price}</span>
                      <span className="text-xs text-white/25 line-through ml-2">${c.originalPrice}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/25">
                      <Users className="w-3 h-3" />{c.students.toLocaleString()}
                    </div>
                  </div>

                  <button className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl border border-white/10 text-white/50 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all">
                    Ver curso completo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RUTAS */}
      <section id="rutas" className="py-24 bg-gradient-to-b from-[#040608] to-[#050a0c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Rutas de aprendizaje</h2>
            <p className="text-white/35 max-w-xl mx-auto">Secuencias de cursos diseñadas para llevarte de cero a profesional en el menor tiempo posible.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map(path => (
              <div key={path.name} className={`p-6 rounded-2xl border relative overflow-hidden`} style={{ borderColor: path.accent + "30" }}>
                <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${path.accent}, transparent)` }} />
                <div className="relative">
                  <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-4`} style={{ backgroundColor: path.accent + "20", color: path.accent }}>{path.level}</div>
                  <h3 className="text-xl font-black text-white mb-2">{path.name}</h3>
                  <p className="text-sm text-white/35 leading-relaxed mb-5">{path.desc}</p>
                  <div className="space-y-2 mb-5">
                    {path.courses.map((course, i) => (
                      <div key={course} className="flex items-center gap-2 text-xs text-white/40">
                        <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-white/25">{i + 1}</div>
                        {course}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/30">Duración</span>
                      <span className="font-semibold" style={{ color: path.accent }}>{path.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/30">Salario esperado</span>
                      <span className="font-semibold text-emerald-400">{path.salary}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2.5 text-sm font-bold rounded-xl transition-all" style={{ backgroundColor: path.accent + "20", color: path.accent, borderColor: path.accent + "30" }}>
                    Iniciar esta ruta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-20 bg-[#040608]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Cómo funciona</h2>
            <p className="text-white/35">4 pasos para transformar tu carrera.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.map(step => {
              const Icon = step.icon
              return (
                <div key={step.n} className="p-5 rounded-2xl border border-indigo-900/20 bg-indigo-950/10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-900/50 mb-2">{step.n}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-white/30 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* INSTRUCTORES */}
      <section id="instructores" className="py-24 bg-gradient-to-b from-[#040608] to-[#050a10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Aprende de los mejores</h2>
            <p className="text-white/35">Instructores que trabajan en las empresas más importantes del mundo. No teóricos, sino practicantes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {instructors.map(ins => (
              <div key={ins.name} className="p-5 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${ins.color} flex items-center justify-center text-xl font-black text-white mb-4`}>
                  {ins.avatar}
                </div>
                <h3 className="font-bold text-white">{ins.name}</h3>
                <p className="text-xs text-indigo-400/60 mb-2">{ins.title}</p>
                <p className="text-xs text-white/30 leading-relaxed mb-4">{ins.bio}</p>
                <div className="flex items-center gap-3 text-xs text-white/25 mb-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-amber-400">{ins.rating}</span></span>
                  <span><Users className="w-3 h-3 inline mr-1" />{ins.students.toLocaleString()}</span>
                  <span><BookOpen className="w-3 h-3 inline mr-1" />{ins.courses} cursos</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ins.badges.map(b => (
                    <span key={b} className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-900/25 text-indigo-400/60 border border-indigo-900/30">{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 bg-[#040608]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-12">Historias de transformación real</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-indigo-900/20 bg-indigo-950/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-800/30 flex items-center justify-center text-sm font-bold text-indigo-400">{t.avatar}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-[11px] text-white/30">{t.role}</div>
                  </div>
                  <div className={`text-[10px] font-bold ${t.color} bg-current/10 px-2 py-1 rounded-lg`}>{t.salary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-24 bg-gradient-to-b from-[#040608] to-[#06090f]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Elige tu plan</h2>
            <p className="text-white/35">Empieza gratis. Escala cuando estés listo. Cancela cuando quieras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricingPlans.map(p => (
              <div key={p.name} className={`p-6 rounded-2xl border relative ${p.highlight ? "border-indigo-500/40 bg-indigo-950/20" : "border-white/7 bg-white/2"}`}>
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full ${p.highlight ? "bg-indigo-600 text-white" : "bg-emerald-700 text-emerald-100"}`}>{p.badge}</div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {p.price > 0 ? (
                    <><span className="text-3xl font-black text-white">${p.price}</span><span className="text-white/35 text-sm">{p.period}</span></>
                  ) : (
                    <span className="text-xl font-black text-white/60">{p.period === "siempre" ? "Gratis" : "Precio a medida"}</span>
                  )}
                </div>
                <p className="text-xs text-white/35 mb-5">{p.desc}</p>
                <div className="space-y-2 mb-6">
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
                <button className={`w-full py-3 text-sm font-bold rounded-xl transition-all ${p.ctaStyle}`}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-[#040608]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-b from-[#040608] to-[#06090f]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-700/30 text-indigo-300 text-xs mb-8">
            <TrendingUp className="w-3 h-3" /> 215,000 estudiantes ya están aprendiendo
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
            La mejor inversión es en
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> ti mismo</span>
          </h2>
          <p className="text-white/35 mb-8">7 días gratis. Sin tarjeta de crédito. Empieza hoy con acceso completo a Pro.</p>
          <a href="#precios" className="inline-block px-10 py-4 font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all shadow-2xl shadow-indigo-900/40 text-sm">
            Comenzar 7 días gratis →
          </a>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] bg-[#030508] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <span className="text-white/40 font-bold">SkillForge Academia Pro</span>
          </div>
          <p>© 2025 SkillForge · 215,000+ estudiantes · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}
