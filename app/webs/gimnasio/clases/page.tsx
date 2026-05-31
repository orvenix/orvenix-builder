"use client"
import Link from "next/link"
import { clases } from "../data/index"

const horario = [
  { hora: "06:00", lun: "Strength", mar: "HIIT", mie: "Strength", jue: "Yoga", vie: "Strength", sab: "CrossFit" },
  { hora: "07:00", lun: "Spinning", mar: "Yoga", mie: "HIIT", jue: "Spinning", vie: "Yoga", sab: "Pilates" },
  { hora: "09:00", lun: "CrossFit", mar: "Pilates", mie: "CrossFit", jue: "HIIT", vie: "CrossFit", sab: "Spinning" },
  { hora: "11:00", lun: "Yoga", mar: "Strength", mie: "Yoga", jue: "CrossFit", vie: "HIIT", sab: "Yoga" },
  { hora: "18:00", lun: "HIIT", mar: "CrossFit", mie: "Spinning", jue: "Strength", vie: "Pilates", sab: "—" },
  { hora: "19:00", lun: "Strength", mar: "Spinning", mie: "Strength", jue: "Yoga", vie: "Spinning", sab: "—" },
  { hora: "20:00", lun: "Pilates", mar: "HIIT", mie: "Pilates", jue: "CrossFit", vie: "Yoga", sab: "—" },
]

const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default function GimnasioClases() {
  return (
    <div className="min-h-screen bg-[#0f0804]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-orange-900/8 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-900/20 border border-orange-700/25 text-orange-400 text-xs mb-6">42 clases semanales</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestras</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">clases</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">6 disciplinas. Grupos de máximo 16 personas. Instructores certificados internacionalmente.</p>
        </div>
      </section>

      {/* Disciplinas */}
      <section className="pb-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clases.map(c => {
            const Icon = c.icon
            return (
              <div key={c.name} className={`p-6 rounded-2xl border ${c.border} ${c.bg} hover:scale-[1.01] transition-all`}>
                <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <h3 className="font-bold text-white mb-1">{c.name}</h3>
                <div className="flex gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${c.bg} ${c.color} border ${c.border}`}>{c.nivel}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${c.bg} ${c.color} border ${c.border}`}>{c.duracion}</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">{c.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Horario */}
      <section className="py-16 bg-[#0d0703]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white mb-8 text-center">Horario semanal</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                  <th className="text-left px-4 py-3 text-white/30 font-semibold">Hora</th>
                  {dias.map(d => <th key={d} className="px-4 py-3 text-white/30 font-semibold">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {horario.map(row => (
                  <tr key={row.hora} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-orange-400 font-bold">{row.hora}</td>
                    {[row.lun, row.mar, row.mie, row.jue, row.vie, row.sab].map((clase, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {clase !== "—"
                          ? <span className="px-2 py-1 rounded-lg bg-orange-900/20 text-orange-300/80 text-[10px] font-semibold">{clase}</span>
                          : <span className="text-white/10">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-white/25 mt-4">Reserva tu lugar en la app · Cupo máximo 16 personas por clase</p>
        </div>
      </section>

      <section className="py-16 bg-[#0f0804]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6">Primeras 7 clases completamente gratis</p>
          <Link href="/webs/gimnasio/contacto" className="px-8 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-900/30 inline-block">
            Empezar prueba gratuita
          </Link>
        </div>
      </section>
    </div>
  )
}
