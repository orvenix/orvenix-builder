"use client"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="receipt-no-print flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg"
    >
      <Printer size={16} />
      Guardar / Imprimir PDF
    </button>
  )
}
