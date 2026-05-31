"use client"
import Link from "next/link"
import { TrendingUp, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/finanzas", label: "Inicio" },
  { href: "/webs/finanzas/servicios", label: "Servicios" },
  { href: "/webs/finanzas/nosotros", label: "Nosotros" },
  { href: "/webs/finanzas/blog", label: "Blog" },
  { href: "/webs/finanzas/testimonios", label: "Testimonios" },
  { href: "/webs/finanzas/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-emerald-600",
  iconTo: "to-teal-800",
  accentText: "text-emerald-400",
  accentBg: "bg-emerald-600",
  accentHover: "hover:bg-emerald-500",
  accentShadow: "shadow-emerald-900/40",
  accentBorder: "border-emerald-700/25",
  accentSubtext: "text-emerald-500/70",
  accentPill: "bg-emerald-900/20",
  mobileBg: "#040f0a",
  progressFrom: "from-emerald-400",
  progressTo: "to-teal-500",
}

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#040f0a] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/finanzas/contacto", label: "Diagnóstico gratis" }}
        Icon={TrendingUp}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/[0.04] bg-[#020a06] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">
                Asesores financieros independientes con {new Date().getFullYear() - parseInt(brand.founded)} años de experiencia. {brand.license}
              </p>
              <p className="text-[11px] text-emerald-900/50">Supervisado por la CNBV</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-700/60 uppercase tracking-wider mb-4">Servicios</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Gestión patrimonial", "Planeación financiera", "Retiro", "Optimización fiscal", "Finanzas corporativas", "Acceso a mercados"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-700/60 uppercase tracking-wider mb-4">Empresa</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => (
                  <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-emerald-900/50 pt-1">Lun–Vie 9:00–18:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} · {brand.sub} · {brand.license}</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Aviso de privacidad</a>
              <a href="#" className="hover:text-white/35">Términos</a>
              <a href="#" className="hover:text-white/35">Divulgación de riesgos</a>
            </div>
          </div>
        </div>
      <OrvenixBadge />
      </footer>
    </div>
  )
}


