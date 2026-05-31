import type { Metadata } from "next"
import Navbar from "@/app/webs/vistamoda/_site/components/Navbar"
import Footer from "@/app/webs/vistamoda/_site/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "VistaModa - Moda que te define",
    template: "%s | VistaModa",
  },
  description:
    "Descubre la ultima tendencia en moda para mujer, hombre y accesorios. Envio gratis en compras mayores a $1,500.",
}

export default function VistaModaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-vistamoda min-h-screen font-sans">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
