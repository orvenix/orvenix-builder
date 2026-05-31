"use client"
import { useState } from "react"
import { Star, Clock, MapPin, Phone, Share2, Globe, AtSign, Utensils, Award, Users, Calendar } from "lucide-react"
import { menuCategories, stats } from "./data/menu"
import { reviews } from "./data/reviews"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#menú", label: "Menú" },
  { href: "#nuestra-historia", label: "Historia" },
  { href: "#reservaciones", label: "Reservaciones" },
  { href: "#eventos", label: "Eventos" },
  { href: "#contacto", label: "Contacto" },
]
const _theme = {
  iconFrom: "from-amber-700", iconTo: "to-orange-900",
  accentText: "text-amber-400", accentBg: "bg-amber-700", accentHover: "hover:bg-amber-600",
  accentShadow: "shadow-amber-900/50", accentBorder: "border-amber-700/30",
  accentSubtext: "text-amber-600/60", accentPill: "bg-amber-900/20",
  mobileBg: "#0a0603", progressFrom: "from-amber-400", progressTo: "to-orange-500",
}

export default function RestaurantePage() {
  const [activeMenu, setActiveMenu] = useState("entradas")
  const [reserva, setReserva] = useState({ nombre: "", fecha: "", hora: "", personas: "2", ocasion: "" })

  const activeCategory = menuCategories.find((c) => c.id === activeMenu)!

  return (
    <div className="min-h-screen bg-[#0a0603] text-white font-sans">
      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "Maison", sub: "Haute Cuisine" }} links={_navLinks} cta={{ href: "#reservaciones", label: "Reservar mesa" }} Icon={Utensils} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0603]/60 via-[#0a0603]/50 to-[#0a0603]" />
        <div className="relative text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300 text-xs mb-8 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Abierto hoy · 13:00 – 23:30
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
            <span className="text-amber-100">Una experiencia</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 bg-clip-text text-transparent">
              gastronómica
            </span>
            <br />
            <span className="text-amber-200/70">que perdura</span>
          </h1>
          <p className="text-lg text-amber-200/50 max-w-xl mx-auto leading-relaxed mb-12">
            Alta cocina mexicana de autor con influencias europeas. 18 años creando momentos extraordinarios en el corazón de la Ciudad de México.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#reservaciones" className="px-8 py-3.5 font-bold rounded-full bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/50">
              Reservar ahora
            </a>
            <a href="#menu" className="px-8 py-3.5 font-bold rounded-full border border-amber-700/50 text-amber-300 hover:bg-amber-900/30 transition-all">
              Ver el menú
            </a>
          </div>

          {/* Stats strip hero */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-black/30 backdrop-blur-md border border-amber-800/30 rounded-2xl px-4 py-4">
                <div className="text-2xl font-black text-amber-400">{s.value}</div>
                <div className="text-xs text-amber-200/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MENÚ */}
      <section id="menú" className="py-28 bg-[#0a0603]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-800/30 text-amber-500 text-xs mb-5">
              Temporada primavera 2025
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-amber-100 mb-4">Nuestra Carta</h2>
            <p className="text-amber-200/40 max-w-lg mx-auto">Ingredientes de temporada seleccionados diariamente. El menú puede variar según disponibilidad del mercado.</p>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 justify-center flex-wrap mb-12">
            {menuCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveMenu(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeMenu === cat.id
                    ? "bg-amber-700 text-amber-100 shadow-lg"
                    : "border border-amber-900/50 text-amber-400/60 hover:text-amber-300 hover:border-amber-700/50"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {activeCategory.items.map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between gap-6 p-5 rounded-2xl border border-amber-900/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-800/50 transition-all group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-amber-100 group-hover:text-amber-300 transition-colors">{item.name}</h3>
                    {item.tag && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-700/40 text-amber-400 border border-amber-700/30">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-amber-200/35 leading-relaxed">{item.desc}</p>
                </div>
                <div className="text-lg font-black text-amber-400 whitespace-nowrap">${item.price.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-amber-800/60 mt-8">Precios en MXN · IVA incluido · Propina sugerida 15% · Menú sujeto a cambios</p>
        </div>
      </section>

      {/* NUESTRA HISTORIA */}
      <section id="nuestra-historia" className="py-28 bg-gradient-to-b from-[#0a0603] to-[#0d0804]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-amber-950/30 border border-amber-800/20">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80')] bg-cover bg-center" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#0a0603] border border-amber-800/30 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-700/40 flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-200">Chef Ejecutivo</div>
                    <div className="text-xs text-amber-500">Premiado Gault&Millau 2023</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-800/30 text-amber-500 text-xs mb-6">
                Desde 2007
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-amber-100 mb-6 leading-tight">
                Una cocina nacida de la
                <span className="text-amber-500"> pasión</span> y el respeto al
                <span className="text-amber-500"> ingrediente</span>
              </h2>
              <p className="text-amber-200/45 leading-relaxed mb-6">
                Chef Armando Reyes comenzó en los fogones de su abuela en Oaxaca, perfeccionó su técnica en París bajo el Chef Alain Ducasse, y regresó a México con una misión: elevar la cocina nacional sin perder su alma.
              </p>
              <p className="text-amber-200/45 leading-relaxed mb-10">
                Cada platillo en Maison es una conversación entre la memoria y la vanguardia: técnicas clásicas, ingredientes de temporada directamente con productores locales, y la convicción de que la buena mesa une a las personas.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Award, label: "3 premios Gault&Millau" },
                  { icon: Users, label: "Equipo de 45 personas" },
                  { icon: Calendar, label: "18 años de historia" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center p-4 rounded-xl border border-amber-900/30 bg-amber-950/20">
                    <Icon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-amber-300/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESERVACIONES */}
      <section id="reservaciones" className="py-28 bg-[#0d0804]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-amber-100 mb-4">Reserva tu mesa</h2>
            <p className="text-amber-200/40">Reservaciones disponibles con mínimo 2 horas de anticipación. Para grupos mayores a 10 personas, contáctanos directamente.</p>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/30 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Juan García" },
                { key: "fecha", label: "Fecha", type: "date", placeholder: "" },
                { key: "hora", label: "Hora deseada", type: "time", placeholder: "" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className={key === "nombre" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={reserva[key as keyof typeof reserva]}
                    onChange={(e) => setReserva({ ...reserva, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-amber-800/40 rounded-xl text-amber-100 placeholder-amber-800/50 focus:outline-none focus:border-amber-600/60 text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">Número de personas</label>
                <select
                  aria-label="Número de personas"
                  value={reserva.personas}
                  onChange={(e) => setReserva({ ...reserva, personas: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/40 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/60 text-sm"
                >
                  {["1","2","3","4","5","6","7","8","9","10+"].map((n) => (
                    <option key={n} value={n} className="bg-[#0d0804]">{n} persona{n !== "1" ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-2">Ocasión especial</label>
                <select
                  aria-label="Ocasión especial"
                  value={reserva.ocasion}
                  onChange={(e) => setReserva({ ...reserva, ocasion: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-800/40 rounded-xl text-amber-100 focus:outline-none focus:border-amber-600/60 text-sm"
                >
                  <option value="" className="bg-[#0d0804]">Ninguna</option>
                  {["Aniversario","Cumpleaños","Cena de negocios","Propuesta de matrimonio","Celebración familiar"].map((o) => (
                    <option key={o} value={o} className="bg-[#0d0804]">{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 transition-all shadow-xl shadow-amber-900/40 text-sm tracking-wide">
              Confirmar reservación
            </button>

            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-amber-700/60">
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +52 55 5555 0000</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Lun–Dom 13:00–23:30</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Polanco, CDMX</span>
            </div>
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="py-24 bg-[#0a0603]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-amber-100 mb-3">Lo que dicen nuestros comensales</h2>
            <div className="flex items-center justify-center gap-2 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400" />)}
              <span className="text-amber-200/60 text-sm ml-2">4.9 · 1,248 reseñas en Google</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div key={r.name} className="p-6 rounded-2xl border border-amber-900/30 bg-amber-950/15 hover:bg-amber-950/30 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  <span className="text-amber-800/60 text-xs ml-auto">{r.date}</span>
                </div>
                <p className="text-sm text-amber-200/50 leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-800/40 flex items-center justify-center text-xs font-bold text-amber-400">
                      {r.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-amber-200">{r.name}</div>
                      <div className="text-[11px] text-amber-700">{r.handle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700/60 border border-amber-900/40 px-2 py-0.5 rounded-full">{r.occasion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-amber-900/30 bg-[#080502] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="w-5 h-5 text-amber-600" />
                <span className="font-black text-amber-200 tracking-widest uppercase text-sm">Maison</span>
              </div>
              <p className="text-xs text-amber-800/60 leading-relaxed">Alta cocina mexicana de autor. Premio Gault&Millau 2021, 2022 y 2023. Polanco, Ciudad de México.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">Horarios</h4>
              <div className="space-y-2 text-xs text-amber-800/60">
                <p>Lunes – Viernes: 13:00 – 23:30</p>
                <p>Sábado – Domingo: 12:00 – 00:00</p>
                <p className="text-amber-700">Cerrado los martes</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">Ubicación</h4>
              <div className="space-y-1 text-xs text-amber-800/60">
                <p>Av. Presidente Masaryk 345</p>
                <p>Polanco V Sección, CDMX</p>
                <p>CP 11560</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">Redes sociales</h4>
              <div className="flex gap-3">
                {[Share2, Globe, AtSign].map((Icon, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={["Instagram", "Facebook", "Twitter"][i]}
                    className="w-9 h-9 rounded-full border border-amber-800/40 flex items-center justify-center text-amber-700 hover:text-amber-400 hover:border-amber-700 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-amber-900/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-amber-900/50">
            <p>© 2025 Maison Haute Cuisine · Todos los derechos reservados</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-amber-700">Aviso de privacidad</a>
              <a href="#" className="hover:text-amber-700">Términos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
