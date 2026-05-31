"use client"
import Link from "next/link"
import { AtSign, Layers, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/arquitectura", label: "Inicio" },
  { href: "/webs/arquitectura/servicios", label: "Servicios" },
  { href: "/webs/arquitectura/proyectos", label: "Proyectos" },
  { href: "/webs/arquitectura/nosotros", label: "Nosotros" },
  { href: "/webs/arquitectura/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-amber-700",
  iconTo: "to-stone-700",
  accentText: "text-amber-400",
  accentBg: "bg-amber-700",
  accentHover: "hover:bg-amber-600",
  accentShadow: "shadow-amber-900/40",
  accentBorder: "border-amber-700/25",
  accentSubtext: "text-amber-600/70",
  accentPill: "bg-amber-900/20",
  mobileBg: "#0a0908",
  progressFrom: "from-amber-400",
  progressTo: "to-orange-500",
}

export default function ArquitecturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0908] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: "Arquitectura & Diseño" }}
        links={navLinks}
        cta={{ href: "/webs/arquitectura/contacto", label: "Solicitar cotización" }}
        Icon={Layers}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/[0.05] bg-[#070604] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-amber-600" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed mb-4">{new Date().getFullYear() - parseInt(brand.founded)} años diseñando espacios que trascienden. CDMX y República Mexicana.</p>
              <div className="flex items-center gap-2 text-xs text-white/25">
                <AtSign className="w-3 h-3 text-amber-700/50" /> {brand.ig}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Servicios</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Arquitectura Residencial", "Arquitectura Comercial", "Diseño de Interiores", "Remodelación", "Paisajismo", "Sustentable"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Estudio</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} · Todos los derechos reservados</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Privacidad</a>
              <a href="#" className="hover:text-white/35">Términos</a>
            </div>
          </div>
        </div>
      <OrvenixBadge />
      </footer>
    </div>
  )
}


