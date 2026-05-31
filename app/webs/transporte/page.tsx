"use client"
import { useState } from "react"
import { Car, Star, CheckCircle, ChevronDown, Phone, Mail, MapPin, Clock, Shield, Zap } from "lucide-react"
import { serviciosTransporte, statsTransporte } from "./data/servicios"
import { flotilla, paquetes, zonasCobro, testimoniosTransporte } from "./data/flotilla"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const _navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#flotilla", label: "Flotilla" },
  { href: "#cobertura", label: "Cobertura" },
  { href: "#tarifas", label: "Tarifas" },
  { href: "#contacto", label: "Contacto" },
]
const _theme = {
  iconFrom: "from-blue-600", iconTo: "to-blue-800",
  accentText: "text-blue-400", accentBg: "bg-blue-600", accentHover: "hover:bg-blue-500",
  accentShadow: "shadow-blue-900/40", accentBorder: "border-blue-700/25",
  accentSubtext: "text-blue-400/60", accentPill: "bg-blue-900/20",
  mobileBg: "#08111f", progressFrom: "from-blue-400", progressTo: "to-sky-500",
}

export default function TransportePage() {
  const [activeFlota, setActiveFlota] = useState<string>("sedan")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [cotizacion, setCotizacion] = useState({ nombre: "", empresa: "", telefono: "", servicio: "", origen: "", destino: "", fecha: "", hora: "", pasajeros: "1" })

  const faqs = [
    { q: "¿Con cuánto tiempo debo reservar?", a: "Para traslados aeropuerto y puntuales recomendamos mínimo 3 horas de anticipación. Para eventos, bodas y tours, mínimo 48 horas. Para paquetes corporativos con varias unidades, 24-48 horas." },
    { q: "¿Puedo pagar con tarjeta de crédito corporativa?", a: "Sí. Aceptamos tarjetas de crédito/débito, transferencia SPEI, facturación mensual para cuentas corporativas (con contratos mínimos de 3 meses), y efectivo en algunos casos." },
    { q: "¿Qué pasa si hay cambios en el itinerario?", a: "Nuestros chóferes están en contacto constante con nuestra central. Si hay cambios de ruta, retrasos o nuevas necesidades, ajustamos en tiempo real sin burocracia. Es nuestra ventaja operativa." },
    { q: "¿Los chóferes hablan inglés?", a: "Tenemos un núcleo de 15 chóferes con inglés conversacional certificado para servicio a ejecutivos internacionales. Puedes solicitarlo al reservar sin costo adicional (sujeto a disponibilidad)." },
    { q: "¿Tienen cobertura en toda la república?", a: "Operación directa en CDMX, EDOMEX, Querétaro, Guadalajara y Monterrey. Para otros destinos coordinamos con socios de transporte certificados de nuestra red nacional." },
  ]

  const flotaFiltrada = flotilla.filter(v => v.categoria === activeFlota || activeFlota === "todos")

  return (
    <div className="min-h-screen bg-[#08111f] text-white font-sans">

      {/* NAV */}
      <EnhancedSiteNav brand={{ name: "TransEjecutivo", sub: "México" }} links={_navLinks} cta={{ href: "#contacto", label: "Cotizar ahora" }} Icon={Car} theme={_theme} isAnchor />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1800&q=75')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08111f]/95 via-[#08111f]/85 to-[#08111f]/50" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/25 border border-blue-700/25 text-blue-300 text-xs mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operación 24/7 · 80+ unidades disponibles
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
              <span className="text-white">Traslados</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ejecutivos
              </span>
              <br />
              <span className="text-white/30">sin imprevistos</span>
            </h1>
            <p className="text-xl text-white/35 max-w-2xl leading-relaxed mb-10">
              12 años de puntualidad comprobable. Aeropuerto, ejecutivo, tours y eventos. Flota premium con chóferes certificados en CDMX y toda la república.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-16">
              <a href="#contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30">
                Solicitar cotización gratis
              </a>
              <a href="#servicios" className="px-8 py-4 font-bold rounded-xl border border-white/12 text-white/55 hover:text-white hover:border-white/25 transition-all">
                Ver servicios
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsTransporte.map(s => (
                <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-2xl font-black text-blue-400">{s.value}</div>
                  <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-white/[0.04] bg-white/[0.015] py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-xs text-white/25">
          {[
            { icon: Shield, text: "Chóferes certificados SCT" },
            { icon: Zap, text: "98.7% de puntualidad" },
            { icon: CheckCircle, text: "Seguro de pasajeros incluido" },
            { icon: Clock, text: "Despacho en < 15 min" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-blue-600/50" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICIOS */}
      <section id="servicios" className="py-28 bg-[#08111f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Nuestros servicios</h2>
            <p className="text-white/35 max-w-xl mx-auto">Solución de transporte para cada necesidad. Corporativo, personal, eventos y más.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviciosTransporte.map(s => {
              const Icon = s.icon
              return (
                <div key={s.id} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all group`}>
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
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <span className={`font-bold text-sm ${s.color}`}>{s.desde}</span>
                    <span className="text-white/25">{s.duracion}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FLOTILLA */}
      <section id="flotilla" className="py-24 bg-[#0b1525]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Nuestra flotilla</h2>
            <p className="text-white/35">Vehículos de modelos 2022-2025 con mantenimiento preventivo trimestral.</p>
          </div>
          <div className="flex gap-2 justify-center flex-wrap mb-8">
            {[{ id: "todos", label: "Todos" }, { id: "sedan", label: "Sedanes" }, { id: "suv", label: "SUVs" }, { id: "van", label: "Vans" }].map(f => (
              <button type="button" key={f.id} onClick={() => setActiveFlota(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFlota === f.id ? "bg-blue-600 text-white" : "border border-white/10 text-white/35 hover:border-blue-700/40 hover:text-blue-400"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flotaFiltrada.map(v => (
              <div key={v.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-all">
                <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url('${v.img}')` }} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{v.name}</h3>
                      <p className="text-xs text-blue-400/70 mt-0.5">{v.tipo} · {v.capacidad}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/35 leading-relaxed mb-4">{v.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {v.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                        <CheckCircle className="w-3 h-3 text-blue-500/60 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFAS / PAQUETES */}
      <section id="tarifas" className="py-28 bg-[#08111f]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Paquetes y tarifas</h2>
            <p className="text-white/35">Precios transparentes. Sin cuotas ocultas. Factura siempre disponible.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {paquetes.map(p => (
              <div key={p.name} className={`p-6 rounded-2xl border relative ${p.highlight ? "border-blue-500/40 bg-blue-950/15" : "border-white/[0.07] bg-white/[0.02]"}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-blue-400">{p.price}</span>
                  <span className="text-white/35 text-sm">{p.period}</span>
                </div>
                <p className="text-xs text-white/35 leading-relaxed mb-5">{p.desc}</p>
                <div className="space-y-2 mb-5">
                  {p.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-white/50">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                </div>
                <a href="#contacto" className={`block w-full py-3 text-center text-sm font-bold rounded-xl transition-all ${p.highlight ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-white/5 border border-white/15 text-white/70 hover:bg-white/10"}`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>

          {/* ZONAS */}
          <div id="cobertura">
            <h3 className="text-2xl font-black mb-6 text-center">Tarifas por zona</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {zonasCobro.map(z => (
                <div key={z.zona} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                  <div className="text-sm font-bold text-white mb-1">{z.zona}</div>
                  <div className="text-xs text-white/30 mb-2">{z.tiempo}</div>
                  <div className="text-sm font-black text-blue-400">{z.costo}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-white/20 mt-4">Tarifas desde sedán ejecutivo. Incluyen combustible y casetas en zona indicada. IVA no incluido.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-[#0b1525]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Empresas y personas que confían en nosotros</h2>
            <div className="flex items-center justify-center gap-2 text-blue-400 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-blue-400" />)}
              <span className="text-white/35 text-sm ml-2">4.9 · 520 reseñas · Google Business</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimoniosTransporte.map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-blue-400 text-blue-400" />)}
                  <span className="text-white/20 text-[10px] ml-auto">{t.date}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-400">
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
      <section className="py-20 bg-[#08111f]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/[0.06] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white/75">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform shrink-0 ml-3 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-6 pb-5 text-sm text-white/35 leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-28 bg-[#0b1525]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-3">Solicita tu cotización</h2>
            <p className="text-white/35">Respuesta en menos de 30 minutos. Precio final sin sorpresas.</p>
          </div>
          <div className="bg-blue-950/12 border border-blue-800/18 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: "nombre", label: "Nombre / Contacto", type: "text", placeholder: "Tu nombre" },
                { key: "empresa", label: "Empresa (opcional)", type: "text", placeholder: "Nombre de empresa" },
                { key: "telefono", label: "WhatsApp", type: "tel", placeholder: "+52 55 0000 0000" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className={key === "nombre" ? "" : ""}>
                  <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder} value={cotizacion[key as keyof typeof cotizacion]}
                    onChange={e => setCotizacion({ ...cotizacion, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">Tipo de servicio</label>
                <select value={cotizacion.servicio} onChange={e => setCotizacion({ ...cotizacion, servicio: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white focus:outline-none focus:border-blue-600/45 text-sm">
                  <option value="" className="bg-[#08111f]">Seleccionar</option>
                  {serviciosTransporte.map(s => (
                    <option key={s.id} value={s.name} className="bg-[#08111f]">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">Origen</label>
                <input type="text" placeholder="Punto de origen" value={cotizacion.origen}
                  onChange={e => setCotizacion({ ...cotizacion, origen: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">Destino</label>
                <input type="text" placeholder="Punto de destino" value={cotizacion.destino}
                  onChange={e => setCotizacion({ ...cotizacion, destino: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-600/45 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">Fecha</label>
                <input type="date" value={cotizacion.fecha} onChange={e => setCotizacion({ ...cotizacion, fecha: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white focus:outline-none focus:border-blue-600/45 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2">Pasajeros</label>
                <select value={cotizacion.pasajeros} onChange={e => setCotizacion({ ...cotizacion, pasajeros: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-blue-800/25 rounded-xl text-white focus:outline-none focus:border-blue-600/45 text-sm">
                  {["1","2","3","4","5-8","9-14","15-30","30+"].map(n => (
                    <option key={n} value={n} className="bg-[#08111f]">{n} pasajero{n !== "1" ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full mt-5 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30 text-sm">
              Solicitar cotización gratis →
            </button>
            <div className="flex items-center justify-center gap-5 mt-5 text-xs text-white/25">
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +52 55 4455 6677</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> 24 horas / 7 días</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] bg-[#050d19] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-blue-500" />
              <span className="font-black text-white">TransEjecutivo México</span>
            </div>
            <p className="text-xs text-white/20 leading-relaxed">12 años de servicio premium de transporte terrestre en México. Seguridad, puntualidad y profesionalismo garantizados.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-600/60 uppercase tracking-wider mb-4">Servicios</h4>
            <div className="space-y-1 text-xs text-white/25">
              {serviciosTransporte.map(s => <p key={s.id}>{s.name}</p>)}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-600/60 uppercase tracking-wider mb-4">Cobertura</h4>
            <div className="space-y-1 text-xs text-white/25">
              {["CDMX y Zona Metro", "Estado de México", "Querétaro", "Guadalajara", "Monterrey", "Rutas interpersonales"].map(c => <p key={c}>{c}</p>)}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-600/60 uppercase tracking-wider mb-4">Contacto</h4>
            <div className="space-y-2 text-xs text-white/25">
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> +52 55 4455 6677</div>
              <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> operaciones@transejecutivo.mx</div>
              <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Blvd. Adolfo Ruiz Cortines 3242, CDMX</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/[0.04] pt-6 flex items-center justify-between text-[11px] text-white/15">
          <p>© 2025 TransEjecutivo México · SCT-T-14-2013 · Todos los derechos reservados</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/40">Privacidad</a>
            <a href="#" className="hover:text-white/40">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
