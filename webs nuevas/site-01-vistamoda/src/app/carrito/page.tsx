import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag } from 'lucide-react'
import { products } from '@/lib/products'

export const metadata: Metadata = { title: 'Carrito de compras' }

const cartItems = [
  { product: products[0], quantity: 1, size: 'M', color: 'Rojo' },
  { product: products[3], quantity: 2, size: '40', color: 'Negro/Blanco' },
  { product: products[2], quantity: 1, color: 'Negro' },
]

export default function CarritoPage() {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal >= 1500 ? 0 : 199
  const total = subtotal + shipping

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-dark mb-8">
        <ShoppingBag className="inline mr-3 text-brand-600" size={28} />
        Mi carrito ({cartItems.length})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(({ product, quantity, size, color }) => (
            <div key={`${product.id}-${size}`} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
              <div className="relative w-24 h-28 flex-shrink-0 rounded-xl overflow-hidden">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/tienda/${product.slug}`} className="font-semibold text-dark hover:text-brand-600 text-sm line-clamp-2">
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">
                      {size && `Talle: ${size}`}{size && color && ' · '}{color && `Color: ${color}`}
                    </p>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button className="p-1.5 hover:bg-gray-50"><Minus size={14} /></button>
                    <span className="px-3 text-sm font-semibold">{quantity}</span>
                    <button className="p-1.5 hover:bg-gray-50"><Plus size={14} /></button>
                  </div>
                  <span className="font-bold text-dark">
                    ${(product.price * quantity).toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Link href="/tienda" className="flex items-center gap-2 text-brand-600 font-medium text-sm mt-4 hover:gap-3 transition-all">
            ← Continuar comprando
          </Link>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-dark mb-5">Resumen del pedido</h2>

            {/* Cupón */}
            <div className="flex gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3">
                <Tag size={14} className="text-gray-400" />
                <input type="text" placeholder="Código de descuento" className="flex-1 py-2.5 text-sm focus:outline-none" />
              </div>
              <button className="px-4 bg-dark text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                Aplicar
              </button>
            </div>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {shipping === 0 ? 'Gratis 🎉' : `$${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-orange-500">
                  Agregá ${(1500 - subtotal).toLocaleString('es-MX')} más para envío gratis
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
              <span className="font-bold text-dark">Total</span>
              <span className="text-2xl font-black text-dark">${total.toLocaleString('es-MX')}</span>
            </div>

            <Link href="/checkout" className="btn-primary w-full justify-center">
              Finalizar compra <ArrowRight size={18} />
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              🔒 Pago 100% seguro y encriptado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
