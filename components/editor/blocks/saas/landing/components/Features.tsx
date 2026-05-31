import { ArrowRight } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { features, statsStrip } from "../data/features"

export function Features() {
  return (
    <section className="py-32 bg-[#040408] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-linear-to-b from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 mb-6">
            Capacidades de clase enterprise
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Todo lo que necesitas.
            <br />
            <span className="bg-linear-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
              Nada de lo que no.
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            Una plataforma diseñada para escalar desde el primer usuario hasta millones, sin comprometer la velocidad ni la seguridad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon
            const c = colorStyles[feat.colorKey]
            return (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl border border-white/7 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feat.description}</p>
                <button
                  type="button"
                  className={`mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${c.text}`}
                >
                  Saber más <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/7 rounded-2xl overflow-hidden border border-white/7">
          {statsStrip.map((stat) => (
            <div key={stat.label} className="bg-white/2 px-8 py-8 text-center">
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/35">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
