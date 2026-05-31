"use client"
import { useState } from "react"
import { Search, BedDouble, Bath, Square, Car, Star, Phone, MapPin, TrendingUp, CheckCircle, ChevronRight, Building } from "lucide-react"
import { properties, stats, marketData } from "./data/properties"
import { agents } from "./data/agents"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#propiedades", label: "Propiedades" },
  { href: "#agentes", label: "Agentes" },
  { href: "#proceso", label: "Proceso" },
  { href: "#mercado", label: "Mercado" },
  { href: "#contacto", label: "Contacto" },
]
const _theme = {
  iconFrom: "from-amber-600", iconTo: "to-amber-800",
  accentText: "text-amber-400", accentBg: "bg-amber-600", accentHover: "hover:bg-amber-500",
  accentShadow: "shadow-amber-900/40", accentBorder: "border-amber-700/25",
  accentSubtext: "text-amber-500/50", accentPill: "bg-amber-900/20",
  mobileBg: "#060609", progressFrom: "from-amber-400", progressTo: "to-yellow-500",
}

const propertyTypes = ["Todos", "Casa", "Departamento", "Penthouse", "Ático", "Villa", "Loft"]
const testimonials = [
  { name: "Mariana Gutiérrez", text: "Encontré el depa de mis sueños en Polanco en 3 semanas. Gabriela fue increíble: conoce cada edificio, negoció el precio y coordinó todo el proceso legal.", avatar: "MG", deal: "Compra · Polanco" },
  { name: "Andrés Castillo", text: "Vendí mi casa en Lomas en 45 días a precio de lista. El plan de marketing con video profesional y recorrido 3D fue clave. Servicio de primer nivel.", avatar: "AC", deal: "Venta · Lomas de Chapultepec" },
  { name: "Elena Moreno", text: "Roberto me asesoró en inversión: compré 2 departamentos en Reforma con plusvalía garantizada. Ya generan $85k/mes en renta sin preocuparme de nada.", avatar: "EM", deal: "Inversión · Reforma" },
]

const steps = [
  { n: "01", title: "Consulta gratuita", desc: "Analizamos tu perfil de comprador o vendedor, presupuesto, zona y objetivos de inversión." },
  { n: "02", title: "Selección personalizada", desc: "Te presentamos opciones curadas que coinciden exactamente con tus criterios. Sin perder tu tiempo." },
  { n: "03", title: "Visitas y negociación", desc: "Coordinamos recorridos y negociamos en tu nombre para obtener el mejor precio y condiciones." },
  { n: "04", title: "Cierre y escrituración", desc: "Manejamos todo el proceso legal, notarial y de financiamiento hasta que las llaves están en tus manos." },
]

export default function InmobiliariaPage() {
  const [activeType, setActiveType] = useState("Todos")
  const [activeTab, setActiveTab] = useState<"comprar" | "rentar">("comprar")
  const [valoracion, setValoracion] = useState({ nombre: "", telefono: "", direccion: "", tipo: "" })

  return (
    <div className="min-h-screen bg-[#060609] text-white font-sans">
      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "Élite", sub: "Inmobiliaria Premium" }} links={_navLinks} cta={{ href: "#valoracion", label: "Valoración gratis" }} Icon={Building} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1800&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060609] via-[#060609]/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/30 border border-amber-700/30 text-amber-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {properties.length} propiedades disponibles ahora
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">La propiedad</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">perfecta</span>
              <br />
              <span className="text-white/50">te está esperando</span>
            </h1>
            <p className="text-lg text-white/35 leading-relaxed mb-10">
              15 años conectando a las familias y empresas más importantes de México con las mejores propiedades. Más de $4,200 millones en transacciones exitosas.
            </p>

            {/* Search widget */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex gap-2 mb-4">
                {(["comprar", "rentar"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-amber-600 text-white" : "text-white/40 hover:text-white/60"}`}
                  >{tab}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-black/30 border border-white/[0.08] rounded-xl">
                  <Search className="w-4 h-4 text-white/25" />
                  <input type="text" placeholder="Colonia, ciudad o código postal..." className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none" />
                </div>
                <button className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl transition-all whitespace-nowrap">
                  Buscar
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map(s => (
                <div key={s.label} className="p-3 rounded-xl border border-amber-900/20 bg-amber-950/10">
                  <div className="text-xl font-black text-amber-400">{s.value}</div>
                  <div className="text-[11px] text-white/25">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROPIEDADES */}
      <section id="propiedades" className="py-24 bg-[#060609]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-black mb-2">Propiedades destacadas</h2>
              <p className="text-white/35">Selección curada de las mejores opciones del mercado</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {propertyTypes.map(t => (
                <button key={t} onClick={() => setActiveType(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeType === t ? "bg-amber-600 text-white" : "border border-white/10 text-white/35 hover:border-amber-700/40 hover:text-amber-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map(p => (
              <div key={p.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all overflow-hidden group">
                {/* Image placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building className="w-16 h-16 text-white/10" />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/60 text-white/70 backdrop-blur-sm">{p.status}</span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${p.tagColor} backdrop-blur-sm border border-current/20`}>{p.tag}</span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-sm font-black text-white">
                      {p.status === "Venta" ? `$${(p.price / 1000000).toFixed(1)}M` : `$${p.price.toLocaleString()}/mes`}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{p.title}</h3>
                      <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/35 my-4">
                    <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" />{p.beds} rec</span>
                    <span className="flex items-center gap-1.5"><Bath className="w-3.5 h-3.5" />{p.baths} baños</span>
                    <span className="flex items-center gap-1.5"><Square className="w-3.5 h-3.5" />{p.area} m²</span>
                    <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" />{p.parking}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <CheckCircle className="w-3 h-3 text-amber-500/50 shrink-0" />{f}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-xs font-semibold rounded-xl border border-amber-600/30 text-amber-400 hover:bg-amber-600/10 transition-all">
                      Ver detalles
                    </button>
                    <button className="flex-1 py-2 text-xs font-semibold rounded-xl bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 transition-all border border-amber-600/20">
                      Agendar visita
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section id="proceso" className="py-24 bg-gradient-to-b from-[#060609] to-[#080a0a]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Proceso sin complicaciones</h2>
            <p className="text-white/35">Desde la búsqueda hasta las llaves en tu mano, en 4 pasos claros.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.n} className="relative p-5 rounded-2xl border border-amber-900/20 bg-amber-950/10 hover:bg-amber-950/20 transition-all">
                <div className="text-4xl font-black text-amber-900/40 mb-3">{s.n}</div>
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-800/30 z-10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTES */}
      <section id="agentes" className="py-24 bg-[#060609]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Nuestros agentes top</h2>
            <p className="text-white/35">Los mejores del mercado inmobiliario de lujo en México.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {agents.map(a => (
              <div key={a.name} className="p-5 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl font-black text-white mb-4`}>
                  {a.avatar}
                </div>
                <h3 className="font-bold text-white">{a.name}</h3>
                <p className="text-xs text-amber-400/60 mb-1">{a.title}</p>
                <p className="text-[11px] text-white/30 mb-3">{a.specialty}</p>
                <div className="flex items-center gap-1 text-xs mb-3">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-amber-400">{a.rating}</span>
                  <span className="text-white/25">· {a.deals} cierres</span>
                </div>
                <p className="text-xs font-bold text-white/40 mb-3">{a.volume}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {a.areas.map(z => (
                    <span key={z} className="px-2 py-0.5 text-[10px] rounded-full bg-amber-900/20 text-amber-500/60 border border-amber-900/30">{z}</span>
                  ))}
                </div>
                <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-amber-400 transition-colors">
                  <Phone className="w-3 h-3" />{a.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MERCADO */}
      <section id="mercado" className="py-24 bg-[#080a0a]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Reporte de mercado CDMX</h2>
            <p className="text-white/35">Datos actualizados del mercado inmobiliario premium · Mayo 2025</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketData.map(m => (
              <div key={m.zone} className="flex items-center justify-between p-5 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 transition-all">
                <div>
                  <h3 className="font-bold text-white mb-0.5">{m.zone}</h3>
                  <p className="text-xs text-white/30">{m.type}</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-400">{m.avg}</div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs justify-end mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>{m.trend} anual</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#060609]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black text-center mb-12">Clientes que confiaron en nosotros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-amber-900/20 bg-amber-950/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-800/30 flex items-center justify-center text-sm font-bold text-amber-400">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-[11px] text-amber-700/60">{t.deal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORACIÓN */}
      <section id="valoracion" className="py-24 bg-gradient-to-b from-[#060609] to-[#080a0d]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Valoración gratuita de tu propiedad</h2>
            <p className="text-white/35">Conoce el valor real de mercado de tu inmueble en menos de 24 horas. Sin compromiso.</p>
          </div>
          <div className="bg-amber-950/15 border border-amber-800/25 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "nombre", label: "Tu nombre", type: "text", placeholder: "Nombre completo" },
                { key: "telefono", label: "Teléfono", type: "tel", placeholder: "+52 55 0000 0000" },
                { key: "direccion", label: "Dirección de la propiedad", type: "text", placeholder: "Calle, colonia, ciudad" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className={key === "direccion" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={valoracion[key as keyof typeof valoracion]}
                    onChange={e => setValoracion({ ...valoracion, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-600/50 text-sm"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-amber-400/60 uppercase tracking-wider mb-2">Tipo de propiedad</label>
                <select value={valoracion.tipo} onChange={e => setValoracion({ ...valoracion, tipo: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-white focus:outline-none focus:border-amber-600/50 text-sm">
                  <option value="" className="bg-[#060609]">Seleccionar tipo</option>
                  {["Casa","Departamento","Penthouse","Terreno","Local comercial","Oficina"].map(t => (
                    <option key={t} value={t} className="bg-[#060609]">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="w-full mt-5 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 text-sm">
              Solicitar valoración gratuita
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.05] bg-[#040506] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-amber-600" /><span className="text-white/40 font-bold">Élite Inmobiliaria Premium</span></div>
          <p>© 2025 · Cédula profesional AMPI · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}
