import Link from "next/link"
import { ArrowRight, Play, Sparkles } from "lucide-react"

const SIDEBAR_WIDTHS = [68, 82, 74, 95, 77, 88]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#040408]">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 text-center pt-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-sm text-white/60 mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Nuevo: IA generativa integrada en cada flujo</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-7xl xl:text-8xl font-black tracking-tight leading-none mb-8">
          <span className="text-white">La plataforma que</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" }}
          >
            escala tu negocio
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/45 max-w-3xl mx-auto leading-relaxed mb-12">
          Automatiza operaciones, centraliza tu equipo y acelera el crecimiento con la única plataforma SaaS que conecta todos tus flujos de trabajo en un solo lugar.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/50">
            Empieza gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/plataforma" className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-lg transition-all backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            Ver demo en vivo
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["#7c3aed", "#2563eb", "#10b981", "#f59e0b", "#ef4444"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#040408] flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: c }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span>+12,000 equipos activos</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 text-amber-400">★</div>
            ))}
            <span>4.9/5 en G2 · 1,840+ reseñas</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <span>Sin tarjeta de crédito</span>
        </div>

        {/* App preview mockup */}
        <div className="mt-20 relative">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#040408] to-transparent z-10" />
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="h-8 bg-white/[0.04] border-b border-white/[0.06] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 h-4 mx-6 rounded-full bg-white/[0.05]" />
            </div>
            <div className="h-64 flex">
              <div className="w-40 bg-white/[0.02] border-r border-white/[0.05] p-4 space-y-2">
                {SIDEBAR_WIDTHS.map((width, i) => (
                  <div key={i} className="h-6 rounded-lg bg-white/[0.04]" style={{ width: `${width}%` }} />
                ))}
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  {["#6366f1", "#10b981", "#f59e0b", "#ef4444"].map((c, i) => (
                    <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: `${c}20`, borderWidth: 1, borderColor: `${c}30` }} />
                  ))}
                </div>
                <div className="h-32 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
