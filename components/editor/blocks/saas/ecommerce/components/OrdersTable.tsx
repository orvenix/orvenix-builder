import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { orders, orderStatusStyles, orderStatusLabels } from "../data/orders"

export function OrdersTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Pedidos Recientes</h3>
          <p className="text-xs text-slate-400 mt-0.5">342 pedidos activos ahora</p>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Ver todos
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/60">
              {["Pedido", "Cliente", "Producto", "Importe", "Estado", "Fecha"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const c = colorStyles[order.colorKey]
              const statusClass = orderStatusStyles[order.status]
              const statusLabel = orderStatusLabels[order.status]
              return (
                <tr
                  key={order.id}
                  className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-mono font-semibold text-slate-700">{order.id}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${c.bgSolid}`}>
                        {order.initials}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{order.customer}</div>
                        <div className="text-xs text-slate-400">{order.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-slate-600 truncate max-w-40 block">{order.product}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-bold text-slate-800">{order.amount}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-slate-400">{order.date}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
