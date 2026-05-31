import type { Metadata } from "next"
import Navbar from "@/app/webs/ferreteria/_site/components/Navbar"
import Footer from "@/app/webs/ferreteria/_site/components/Footer"

export const metadata: Metadata = {
  title: {
    default: "Ferreteria El Constructor - Todo para tu obra",
    template: "%s | El Constructor",
  },
  description:
    "Ferreteria con mas de 20 anos de trayectoria. Herramientas, materiales de construccion, pinturas y mas.",
}

export default function FerreteriaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-ferreteria min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
