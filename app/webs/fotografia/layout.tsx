"use client"
import Link from "next/link"
import { Camera, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/fotografia", label: "Inicio" },
  { href: "/webs/fotografia/servicios", label: "Servicios" },
  { href: "/webs/fotografia/portafolio", label: "Portafolio" },
  { href: "/webs/fotografia/nosotros", label: "Nosotros" },
  { href: "/webs/fotografia/blog", label: "Blog" },
  { href: "/webs/fotografia/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-yellow-500",
  iconTo: "to-amber-700",
  accentText: "text-yellow-400",
  accentBg: "bg-yellow-500",
  accentHover: "hover:bg-yellow-400",
  accentShadow: "shadow-yellow-900/40",
  accentBorder: "border-yellow-700/25",
  accentSubtext: "text-yellow-500/70",
  accentPill: "bg-yellow-900/20",
  mobileBg: "#080708",
  progressFrom: "from-yellow-400",
  progressTo: "to-amber-500",
}

export default function FotografiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080708] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/fotografia/contacto", label: "Reservar sesión" }}
        Icon={Camera}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/[0.05] bg-[#050405] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-yellow-500" />
                <span className="font-black text-white tracking-tight">{brand.name}</span>
                <span className="text-white/30 font-normal text-sm">{brand.sub}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">
                Estudio de fotografía y videografía profesional con {new Date().getFullYear() - parseInt(brand.founded)} años documentando los momentos más importantes de tu vida.
              </p>
              <p className="text-[11px] text-yellow-900/50">{brand.instagram}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Servicios</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Fotografía de Bodas", "Quinceañeras", "Corporativo", "Videografía", "Retratos", "Producto"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Estudio</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => (
                  <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-yellow-900/50 pt-1">Lun–Sáb 10:00–19:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.sub} · Todos los derechos reservados</p>
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


