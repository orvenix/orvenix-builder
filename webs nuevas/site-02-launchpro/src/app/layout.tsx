import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'LaunchPro — Lanzá tu producto al mercado', template: '%s | LaunchPro' },
  description: 'La plataforma SaaS que necesitás para lanzar, vender y escalar tu negocio digital. Empieza gratis hoy.',
  keywords: ['saas', 'plataforma digital', 'lanzamiento', 'startup', 'negocio online'],
  openGraph: {
    title: 'LaunchPro — Lanzá tu producto al mercado',
    description: 'Plataforma SaaS todo-en-uno para escalar tu negocio.',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
