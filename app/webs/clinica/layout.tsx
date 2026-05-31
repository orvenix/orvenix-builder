"use client"
import Link from "next/link"
import { Stethoscope, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/clinica", label: "Inicio" },
  { href: "/webs/clinica/especialidades", label: "Especialidades" },
  { href: "/webs/clinica/medicos", label: "Médicos" },
  { href: "/webs/clinica/blog", label: "Blog" },
  { href: "/webs/clinica/contacto", label: "Citas" },
]

const theme = {
  iconFrom: "from-teal-500", iconTo: "to-cyan-800",
  accentText: "text-teal-400", accentBg: "bg-teal-600", accentHover: "hover:bg-teal-500",
  accentShadow: "shadow-teal-900/40", accentBorder: "border-teal-700/25",
  accentSubtext: "text-teal-500/70", accentPill: "bg-teal-900/20",
  mobileBg: "#03100f", progressFrom: "from-teal-400", progressTo: "to-cyan-500",
}

export default function ClinicaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#03100f] text-white font-sans">
      <EnhancedSiteNav brand={{ name: brand.name, sub: brand.sub }} links={navLinks}
        cta={{ href: "/webs/clinica/contacto", label: "Agendar cita" }} Icon={Stethoscope} theme={theme} />
      <main className="pt-16">{children}</main>
      <footer className="border-t border-white/[0.04] bg-[#020c0b] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-teal-500" />
                <span className="font-black text-white text-sm">{brand.name}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">{new Date().getFullYear() - parseInt(brand.founded)} años de experiencia médica. Urgencias 24/7: {brand.urgencias}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Especialidades</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Cardiología","Neurología","Pediatría","Ortopedia","Ginecología","Medicina Interna"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Clínica</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-teal-900/60 pt-1">Urgencias 24/7: {brand.urgencias}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} · Todos los derechos reservados</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Privacidad</a><a href="#" className="hover:text-white/35">Términos</a>
            </div>
          </div>
        </div>
        <OrvenixBadge />
      </footer>
    </div>
  )
}
