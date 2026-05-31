import type { Metadata } from "next"
import Navbar from "@/app/webs/launchpro/_site/components/Navbar"
import Footer from "@/app/webs/launchpro/_site/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "LaunchPro - Lanza tu producto al mercado",
    template: "%s | LaunchPro",
  },
  description:
    "La plataforma SaaS que necesitas para lanzar, vender y escalar tu negocio digital. Empieza gratis hoy.",
}

export default function LaunchProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-launchpro min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
