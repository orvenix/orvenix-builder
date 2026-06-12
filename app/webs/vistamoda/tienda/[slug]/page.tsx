import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Truck, Shield, Heart, Share2 } from 'lucide-react'
import { products } from '@/app/webs/vistamoda/_site/lib/products'
import ProductCard from '@/app/webs/vistamoda/_site/components/ProductCard'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const product = products.find(p => p.slug === resolvedParams.slug)
  return { title: product?.name ?? 'Producto' }
}

export async function generateStaticParams() {
  return products.map(p => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const product = products.find(p => p.slug === resolvedParams.slug) ?? products[0]
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/webs/vistamoda" className="hover:text-brand-600">Inicio</Link>
        <span>/</span>
        <Link href="/webs/vistamoda/tienda" className="hover:text-brand-600">Tienda</Link>
        <span>/</span>
        <span className="text-dark font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Imagen */}
        <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="p-2.5 bg-white rounded-full shadow hover:text-red-500 transition-colors">
              <Heart size={18} />
            </button>
            <button className="p-2.5 bg-white rounded-full shadow hover:text-brand-600 transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">{product.category}</p>
          <h1 className="text-3xl font-black text-dark mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm font-semibold">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviews} reseñas)</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-black text-dark">${product.price.toLocaleString('es-MX')}</span>
            {product.originalPrice && (
              <span className="text-xl text-gray-400 line-through">${product.originalPrice.toLocaleString('es-MX')}</span>
            )}
            {product.originalPrice && (
              <span className="badge-sale">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Talles */}
          {product.sizes && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-dark">Talle</span>
                <button className="text-xs text-brand-600 underline">Guía de talles</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} className="px-4 py-2 text-sm border-2 border-gray-200 rounded-lg hover:border-brand-600 font-medium transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colores */}
          {product.colors && (
            <div className="mb-6">
              <span className="text-sm font-semibold text-dark block mb-2">Color</span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button key={c} className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg hover:border-brand-600 transition-colors">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad + CTA */}
          <div className="flex gap-3 mb-6">
            <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
              <button className="px-4 py-3 hover:bg-gray-50 font-bold text-lg">-</button>
              <span className="px-5 py-3 font-semibold">1</span>
              <button className="px-4 py-3 hover:bg-gray-50 font-bold text-lg">+</button>
            </div>
            <button disabled={!product.inStock} className="flex-1 btn-primary justify-center disabled:opacity-50">
              {product.inStock ? 'Agregar al carrito' : 'Sin stock'}
            </button>
          </div>
          <button className="btn-secondary justify-center w-full">
            Comprar ahora
          </button>

          {/* Beneficios */}
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck size={15} className="text-brand-600" /> Envío gratis en compras +$1,500
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={15} className="text-brand-600" /> Garantía de calidad 30 días
            </div>
          </div>
        </div>
      </div>

      {/* Productos relacionados */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-dark mb-6">También te puede gustar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
