import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'VistaModa — Moda que te define',
    template: '%s | VistaModa',
  },
  description: 'Descubre la última tendencia en moda para mujer, hombre y accesorios. Envío gratis en compras mayores a $1,500.',
  keywords: ['moda', 'ropa', 'tienda online', 'vestidos', 'accesorios', 'calzado'],
  openGraph: {
    title: 'VistaModa — Moda que te define',
    description: 'Tienda de moda online con las últimas tendencias.',
    type: 'website',
    locale: 'es_MX',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
