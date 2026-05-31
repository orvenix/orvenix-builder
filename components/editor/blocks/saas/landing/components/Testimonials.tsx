import { Star, Quote } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { testimonials, brands } from "../data/testimonials"

export function Testimonials() {
  return (
    <section className="py-32 bg-[#040408] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 mb-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-xs">★</span>
              ))}
            </div>
            4.9/5 · 1,840+ reseñas verificadas en G2
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Lo que dicen
            <br />
            <span className="bg-linear-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              nuestros clientes
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => {
            const c = colorStyles[t.colorKey]
            return (
              <div
                key={t.id}
                className="p-6 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/4 hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <Quote className="w-5 h-5 text-white/10 mb-3" />
                <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>

                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold mb-4 inline-block ${c.bg} ${c.text}`}>
                  {t.metric}
                </span>

                <div className="flex items-center gap-3 pt-4 border-t border-white/6">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${c.bgSolid}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/35">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-20 text-center">
          <p className="text-xs text-white/25 uppercase tracking-widest mb-8">Confían en nosotros</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {brands.map((brand) => (
              <div key={brand} className="text-lg font-black text-white/15 hover:text-white/30 transition-colors">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
