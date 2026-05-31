import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, ShoppingBag } from 'lucide-react'
import { Product } from '@/types'

const badgeLabels = { nuevo: 'Nuevo', oferta: 'Oferta', popular: 'Popular' }
const badgeStyles = { nuevo: 'badge-new', oferta: 'badge-sale', popular: 'badge-popular' }

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <div className="card-product">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.badge && (
            <span className={badgeStyles[product.badge]}>
              {badgeLabels[product.badge]}
            </span>
          )}
          {discount && (
            <span className="badge bg-red-500 text-white">-{discount}%</span>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg">
              Sin stock
            </span>
          </div>
        )}
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Heart size={16} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="font-semibold text-dark hover:text-brand-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs text-gray-600 font-medium">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-dark">
              ${product.price.toLocaleString('es-MX')}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice.toLocaleString('es-MX')}
              </span>
            )}
          </div>
          <button
            disabled={!product.inStock}
            className="p-2 bg-dark text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-40"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
