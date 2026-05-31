import type { Metadata } from "next"
import Navbar from "@/app/webs/carniceria/_site/components/Navbar"
import Footer from "@/app/webs/carniceria/_site/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "La Res Premium - Carniceria artesanal",
    template: "%s | La Res Premium",
  },
  description:
    "Carniceria artesanal con los mejores cortes de carne. Res, cerdo, pollo y cordero de primera calidad.",
}

export default function CarniceriaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-carniceria min-h-screen font-sans">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
