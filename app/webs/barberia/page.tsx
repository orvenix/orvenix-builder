"use client"
import { useState } from "react"
import { Scissors, Star, ChevronDown, Phone, MapPin, Clock } from "lucide-react"
import { servicios, statsBarber, galeriaItems } from "./data/servicios"
import { barberos, testimoniosBarber, faqsBarber } from "./data/barberos"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#equipo", label: "Equipo" },
  { href: "#precios", label: "Precios" },
  { href: "#reservas", label: "Reservas" },
]
const _theme = {
  iconFrom: "from-amber-800", iconTo: "to-stone-800",
  accentText: "text-amber-400", accentBg: "bg-amber-700", accentHover: "hover:bg-amber-600",
  accentShadow: "shadow-amber-900/40", accentBorder: "border-amber-800/30",
  accentSubtext: "text-amber-700/60", accentPill: "bg-amber-900/20",
  mobileBg: "#111009", progressFrom: "from-amber-500", progressTo: "to-stone-400",
}

export default function BarberizaPage() {
  const [activeTab, setActiveTab] = useState<"todos" | "corte" | "barba" | "tratamientos">("todos")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [reserva, setReserva] = useState({ nombre: "", telefono: "", servicio: "", fecha: "", hora: "", barbero: "" })

  const filtered = activeTab === "todos"
    ? servicios
    : activeTab === "corte"
    ? servicios.filter(s => ["Corte clásico", "Corte + barba", "Fade / Degradado", "Corte infantil"].includes(s.name))
    : activeTab === "barba"
    ? servicios.filter(s => ["Afeitado clásico", "Diseño de barba", "Corte + barba"].includes(s.name))
    : servicios.filter(s => ["Tratamiento capilar", "Color / Mechas", "Paquete VIP"].includes(s.name))

  return (
    <div className="min-h-screen bg-[#111009] text-white font-sans">

      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "Señorío", sub: "Barber Shop" }} links={_navLinks} cta={{ href: "#reservas", label: "Reservar turno" }} Icon={Scissors} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1800&q=75')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111009]/95 via-[#111009]/85 to-[#111009]/50" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/30 border border-amber-700/30 text-amber-400 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Abierto hoy · 9:00 – 20:00
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 leading-none">
              <span className="text-amber-100">El arte del</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                buen corte
              </span>
              <br />
              <span className="text-amber-200/40">desde 2013</span>
            </h1>
            <p className="text-lg text-amber-200/45 max-w-lg leading-relaxed mb-10">
              Barbería de oficio en el corazón de CDMX. Cortes de precisión, afeitados clásicos y experiencia premium para el hombre que valora los detalles.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-14">
              <a href="#reservas" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 transition-all shadow-xl shadow-amber-900/30">
                Reservar ahora
              </a>
              <a href="#galería" className="px-8 py-4 font-bold rounded-xl border border-amber-800/40 text-amber-300/60 hover:text-amber-300 hover:border-amber-700/60 transition-all">
                Ver galería
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statsBarber.map(s => (
                <div key={s.label} className="p-3.5 rounded-xl border border-amber-900/30 bg-black/20 backdrop-blur-sm">
                  <div className="text-xl font-black text-amber-400">{s.value}</div>
                  <div className="text-[11px] text-amber-200/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-28 bg-[#111009]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-amber-100 mb-4">Servicios</h2>
            <p className="text-amber-200/35">Trabajo de precisión con productos premium. Cada servicio tiene tiempo garantizado.</p>
          </div>
          <div className="flex gap-2 justify-center flex-wrap mb-8">
            {(["todos", "corte", "barba", "tratamientos"] as const).map(tab => (
              <button type="button" key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-amber-700 text-amber-100" : "border border-amber-900/40 text-amber-500/50 hover:text-amber-400 hover:border-amber-700/50"}`}>
                {tab === "todos" ? "Todos" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div key={s.name} className={`p-5 rounded-2xl border ${s.popular ? "border-amber-700/40 bg-amber-950/20" : "border-amber-900/25 bg-amber-950/10"} hover:bg-amber-950/30 transition-all`}>
                {s.popular && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-700/30 text-amber-400 border border-amber-700/30 mb-3">
                    Popular
                  </span>
                )}
                <h3 className="font-bold text-amber-100 mb-1.5">{s.name}</h3>
                <p className="text-xs text-amber-200/35 leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-amber-400">${s.precio.toLocaleString()} MXN</span>
                  <span className="text-xs text-amber-700/60 border border-amber-900/30 px-2 py-0.5 rounded-full">{s.duracion}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-amber-800/40 mt-6">Todos los precios incluyen lavado y estilizado. Propina discrecional. · Válido en sucursal CDMX.</p>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galería" className="py-24 bg-[#0d0c08]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-amber-100 mb-4">Galería de trabajos</h2>
            <p className="text-amber-200/35">Cada corte es una firma. Encuentra tu estilo.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galeriaItems.map(g => (
              <div key={g.label} className="group relative aspect-square rounded-2xl overflow-hidden border border-amber-900/20">
                <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${g.img}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-sm font-bold text-amber-200">{g.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="#" className="inline-flex items-center gap-2 text-sm text-amber-500/60 hover:text-amber-400 transition-colors">
              <span className="text-amber-600 font-bold">@</span> Ver más en Instagram @senoriobarbershop
            </a>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo" className="py-24 bg-[#111009]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-amber-100 mb-3">Nuestros barberos</h2>
            <p className="text-amber-200/35">Cada uno con su estilo y especialidad. Elige tu maestro.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {barberos.map(b => (
              <div key={b.name} className="p-6 rounded-2xl border border-amber-900/25 bg-amber-950/10 hover:bg-amber-950/20 transition-all text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${b.color} border-4 border-amber-800/20 flex items-center justify-center text-2xl font-black text-white mx-auto mb-4`}>
                  {b.avatar}
                </div>
                <h3 className="font-bold text-amber-100 mb-1">{b.name}</h3>
                <p className="text-xs text-amber-500/70 mb-1">{b.role}</p>
                <p className="text-[11px] text-amber-200/30 mb-1">{b.esp}</p>
                <p className="text-[11px] text-amber-800/50 mb-3">{b.exp}</p>
                {b.ig && <p className="text-[11px] text-amber-600/40">{b.ig}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0d0c08]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-amber-100 mb-3">Lo que dicen nuestros clientes</h2>
            <div className="flex items-center justify-center gap-2 text-amber-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
              <span className="text-amber-200/35 text-sm ml-2">4.9 · 920 reseñas Google</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimoniosBarber.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-amber-900/25 bg-amber-950/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  <span className="text-amber-800/50 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-amber-200/40 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-800/25 flex items-center justify-center text-xs font-bold text-amber-400">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-200">{t.name}</div>
                    <div className="text-[11px] text-amber-700/60">{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#111009]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-amber-100 text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqsBarber.map((faq, i) => (
              <div key={i} className="border border-amber-900/25 rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-amber-200/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-amber-200/35 leading-relaxed border-t border-amber-900/20 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVAS */}
      <section id="reservas" className="py-28 bg-[#0d0c08]">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-amber-100 mb-3">Reserva tu turno</h2>
            <p className="text-amber-200/35">Elige servicio, barbero y horario. Confirmación en menos de 30 min por WhatsApp.</p>
          </div>
          <div className="bg-amber-950/15 border border-amber-800/20 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Tu nombre" },
                { key: "telefono", label: "WhatsApp", type: "tel", placeholder: "+52 55 0000 0000" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={reserva[key as keyof typeof reserva]}
                    onChange={e => setReserva({ ...reserva, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-amber-100 placeholder-amber-800/40 focus:outline-none focus:border-amber-600/50 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Servicio</label>
                <select aria-label="Servicio" value={reserva.servicio} onChange={e => setReserva({ ...reserva, servicio: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/50 text-sm">
                  <option value="" className="bg-[#111009]">Elige un servicio</option>
                  {servicios.map(s => (
                    <option key={s.name} value={s.name} className="bg-[#111009]">{s.name} – ${s.precio.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Barbero</label>
                <select aria-label="Barbero" value={reserva.barbero} onChange={e => setReserva({ ...reserva, barbero: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/50 text-sm">
                  <option value="" className="bg-[#111009]">Sin preferencia</option>
                  {barberos.map(b => (
                    <option key={b.name} value={b.name} className="bg-[#111009]">{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Fecha deseada</label>
                <input type="date" aria-label="Fecha deseada" value={reserva.fecha} onChange={e => setReserva({ ...reserva, fecha: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-600/60 uppercase tracking-wider mb-2">Hora preferida</label>
                <select aria-label="Hora preferida" value={reserva.hora} onChange={e => setReserva({ ...reserva, hora: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/50 text-sm">
                  <option value="" className="bg-[#111009]">Selecciona hora</option>
                  {["9:00","9:30","10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00","18:00","18:30","19:00"].map(h => (
                    <option key={h} value={h} className="bg-[#111009]">{h} hrs</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 transition-all shadow-xl shadow-amber-900/30 text-sm">
              Confirmar reserva →
            </button>
            <div className="flex items-center justify-center gap-6 mt-5 text-xs text-amber-800/50">
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +52 55 1122 3344</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Lun–Sáb 9:00–20:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-amber-900/20 bg-[#0a0902] py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scissors className="w-5 h-5 text-amber-700" />
              <span className="font-black text-amber-200 tracking-widest uppercase">Señorío Barber Shop</span>
            </div>
            <p className="text-xs text-amber-800/50 leading-relaxed">Barbería de oficio desde 2013. Tradición, precisión y experiencia premium en CDMX.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Ubicación</h4>
            <div className="space-y-1.5 text-xs text-amber-800/50">
              <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Álvaro Obregón 128, Roma Norte, CDMX</div>
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> +52 55 1122 3344</div>
              <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Lun–Sáb 9:00–20:00 · Dom 10:00–15:00</div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Links</h4>
            <div className="space-y-1.5 text-xs text-amber-800/50">
              {["Servicios y precios", "Galería de trabajos", "Nuestros barberos", "Reservar turno"].map(l => (
                <p key={l}><a href="#" className="hover:text-amber-600 transition-colors">{l}</a></p>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-amber-900/15 pt-6 flex items-center justify-between text-[11px] text-amber-900/40">
          <p>© 2025 Señorío Barber Shop · Todos los derechos reservados</p>
          <a href="#" className="hover:text-amber-700">Aviso de privacidad</a>
        </div>
      </footer>
    </div>
  )
}
