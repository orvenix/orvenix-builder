import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react'
import ProductCard from '@/app/webs/vistamoda/_site/components/ProductCard'
import CategoryCard from '@/app/webs/vistamoda/_site/components/CategoryCard'
import { categories, featuredProducts } from '@/app/webs/vistamoda/_site/lib/products'

const benefits = [
  { icon: Truck, title: 'Envío Gratis', desc: 'En compras mayores a $1,500' },
  { icon: Shield, title: 'Compra Segura', desc: 'Pagos 100% protegidos' },
  { icon: RefreshCw, title: 'Devoluciones', desc: '30 días para cambios' },
  { icon: Headphones, title: 'Soporte 24/7', desc: 'Atención personalizada' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600"
            alt="VistaModa Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/80 via-dark/40 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-xl">
            <span className="inline-block bg-brand-500/20 text-brand-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-brand-500/30">
              ✨ Nueva Colección Primavera 2025
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">
              Moda que<br />
              <span className="text-brand-400">te define</span>
            </h1>
            <p className="text-gray-300 text-lg mt-6 leading-relaxed">
              Descubrí las últimas tendencias en ropa, accesorios y calzado. Estilo y calidad en cada prenda.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/webs/vistamoda/tienda" className="btn-primary text-base px-8 py-4">
                Explorar colección <ArrowRight size={18} />
              </Link>
              <Link href="/webs/vistamoda/tienda?cat=oferta" className="border-2 border-white text-white hover:bg-white hover:text-dark font-semibold px-8 py-4 rounded-lg transition-all duration-200 inline-flex items-center gap-2">
                Ver ofertas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 rounded-xl flex-shrink-0">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-dark text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Explorar por categoría</h2>
              <p className="section-subtitle">Encontrá exactamente lo que buscás</p>
            </div>
            <Link href="/webs/vistamoda/tienda" className="hidden md:flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all">
              Ver todo <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Productos destacados</h2>
              <p className="section-subtitle">Los favoritos de nuestra clientela</p>
            </div>
            <Link href="/webs/vistamoda/tienda" className="hidden md:flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all">
              Ver más <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Banner Promocional */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400"
              alt="Oferta especial"
              width={1400}
              height={480}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-brand-600/80 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-16">
                <p className="text-brand-100 text-sm font-semibold uppercase tracking-widest mb-2">Oferta especial</p>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                  Hasta 40% OFF<br />en accesorios
                </h2>
                <Link href="/webs/vistamoda/tienda?cat=accesorios" className="btn-dark">
                  Aprovechar oferta <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-2">Lo que dicen nuestras clientas</h2>
          <p className="text-center text-gray-500 mb-10">Más de 10,000 clientes satisfechos</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'María García', text: 'La calidad es increíble y el envío llegó en 2 días. Definitivamente voy a seguir comprando.', rating: 5 },
              { name: 'Laura Martínez', text: 'Me encantó el vestido floral, exactamente como en las fotos. Excelente atención al cliente.', rating: 5 },
              { name: 'Ana López', text: 'Los colores y materiales son premium. Vale cada centavo, muy recomendable.', rating: 5 },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm">
                    {t.name[0]}
                  </div>
                  <span className="font-semibold text-dark text-sm">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
