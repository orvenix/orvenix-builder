import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', weight: ['400','600','700','800','900'] })

export const metadata: Metadata = {
  title: { default: 'Mundo Mágico — Juguetería para toda la familia', template: '%s | Mundo Mágico' },
  description: 'La juguetería online más completa para chicos de todas las edades. Juguetes educativos, de acción, peluches y más. Envío gratis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${nunito.variable} font-fun`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
