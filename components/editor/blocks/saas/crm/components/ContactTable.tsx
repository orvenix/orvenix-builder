"use client"

import { useState } from "react"
import { MoreHorizontal, Mail, Phone, Star } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { contacts, statusStyles } from "../data/contacts"

function ScoreBar({ score }: { score: number }) {
  // SVG rect `width` is a presentation attribute, not a CSS style — no inline style needed
  const fillClass =
    score >= 85 ? "fill-emerald-500" : score >= 70 ? "fill-amber-500" : "fill-red-500"
  return (
    <div className="flex items-center gap-2">
      <svg
        width={64}
        height={6}
        className="rounded-full overflow-hidden"
        role="img"
        aria-label={`Score ${score} de 100`}
      >
        <rect width="100%" height="100%" fill="#f1f5f9" rx="3" />
        <rect width={`${score}%`} height="100%" className={fillClass} rx="3" />
      </svg>
      <span className="text-xs font-semibold text-slate-600">{score}</span>
    </div>
  )
}

export function ContactTable() {
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-3 px-4 w-8">
                <input type="checkbox" aria-label="Seleccionar todos" className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600" />
              </th>
              {["Contacto", "Estado", "Score", "Deal", "Último contacto", ""].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const c = colorStyles[contact.colorKey]
              const isSelected = selected.includes(contact.id)
              return (
                <tr
                  key={contact.id}
                  className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors group ${isSelected ? "bg-blue-50/40" : ""}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${contact.name}`}
                      checked={isSelected}
                      onChange={() => toggle(contact.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${c.bgSolid}`}>
                        {contact.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-800">{contact.name}</span>
                          {contact.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </div>
                        <div className="text-xs text-slate-400">
                          {contact.role} · {contact.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${statusStyles[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBar score={contact.score} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-bold text-slate-700">{contact.deal}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-400">{contact.lastContact}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" aria-label="Enviar email" className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button type="button" aria-label="Llamar" className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button type="button" aria-label="Más opciones" className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">6 de 1,284 contactos</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${p === 1 ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-100"}`}
            >
              {p}
            </button>
          ))}
          <span className="text-slate-300 text-xs px-1">···</span>
          <button type="button" className="w-7 h-7 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-100">
            214
          </button>
        </div>
      </div>
    </div>
  )
}
