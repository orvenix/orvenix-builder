export type TxStatus = "completed" | "pending" | "failed"
export type TxType = "income" | "expense" | "transfer"

export interface Transaction {
  id: string
  description: string
  category: string
  amount: number
  type: TxType
  status: TxStatus
  date: string
  account: string
}

export const transactions: Transaction[] = [
  { id: "tx-001", description: "Dividendo AAPL", category: "Inversiones", amount: 4_820, type: "income", status: "completed", date: "2026-05-03", account: "Brokerage" },
  { id: "tx-002", description: "Suscripción Bloomberg", category: "Software", amount: -299, type: "expense", status: "completed", date: "2026-05-03", account: "Corporativa" },
  { id: "tx-003", description: "Transferencia reserva", category: "Ahorro", amount: -15_000, type: "transfer", status: "completed", date: "2026-05-02", account: "Savings" },
  { id: "tx-004", description: "Venta NVDA x40", category: "Inversiones", amount: 21_440, type: "income", status: "completed", date: "2026-05-02", account: "Brokerage" },
  { id: "tx-005", description: "Pago nómina equipo", category: "Nómina", amount: -38_000, type: "expense", status: "completed", date: "2026-05-01", account: "Corporativa" },
  { id: "tx-006", description: "Revenue SaaS Q1", category: "Ventas", amount: 82_400, type: "income", status: "pending", date: "2026-04-30", account: "Operaciones" },
  { id: "tx-007", description: "Servidor AWS", category: "Infraestructura", amount: -1_240, type: "expense", status: "completed", date: "2026-04-30", account: "Corporativa" },
  { id: "tx-008", description: "Compra BTC", category: "Crypto", amount: -5_000, type: "expense", status: "failed", date: "2026-04-29", account: "Brokerage" },
]
