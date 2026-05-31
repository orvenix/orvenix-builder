import type { Metadata } from "next"
import Navbar from "@/app/webs/jugueteria/_site/components/Navbar"
import Footer from "@/app/webs/jugueteria/_site/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "Mundo Magico - Jugueteria para toda la familia",
    template: "%s | Mundo Magico",
  },
  description:
    "La jugueteria online mas completa para chicos de todas las edades. Juguetes educativos, de accion, peluches y mas.",
}

export default function JugueteriaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-jugueteria min-h-screen font-fun">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
