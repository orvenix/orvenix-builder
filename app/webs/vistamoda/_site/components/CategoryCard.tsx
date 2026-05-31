import Image from 'next/image'
import Link from 'next/link'
import { Category } from '@/app/webs/vistamoda/_site/types'

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/webs/vistamoda/tienda?cat=${category.slug}`} className="group relative rounded-2xl overflow-hidden aspect-square block">
      <Image
        src={category.image}
        alt={category.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white text-xl font-bold">{category.name}</h3>
        <p className="text-gray-300 text-sm">{category.count} productos</p>
      </div>
    </Link>
  )
}
