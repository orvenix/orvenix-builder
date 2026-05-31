export type EmployeeStatus = "active" | "remote" | "leave" | "onboarding"

export interface Employee {
  id: string
  name: string
  role: string
  department: string
  status: EmployeeStatus
  location: string
  joined: string
  initials: string
  color: string
  performance: number
}

export const employees: Employee[] = [
  { id: "e1", name: "Sofia Martín",    role: "Lead Engineer",   department: "Ingeniería",  status: "active",     location: "Madrid",    joined: "2023-03", initials: "SM", color: "#6366f1", performance: 94 },
  { id: "e2", name: "Carlos Ruiz",     role: "Product Manager", department: "Producto",    status: "remote",     location: "Barcelona", joined: "2022-09", initials: "CR", color: "#10b981", performance: 88 },
  { id: "e3", name: "Ana García",      role: "UX Designer",     department: "Diseño",      status: "active",     location: "Madrid",    joined: "2024-01", initials: "AG", color: "#f59e0b", performance: 91 },
  { id: "e4", name: "Miguel Torres",   role: "Backend Dev",     department: "Ingeniería",  status: "onboarding", location: "Valencia",  joined: "2026-04", initials: "MT", color: "#ec4899", performance: 76 },
  { id: "e5", name: "Laura Sánchez",   role: "Sales Director",  department: "Ventas",      status: "active",     location: "Madrid",    joined: "2021-06", initials: "LS", color: "#06b6d4", performance: 97 },
  { id: "e6", name: "David López",     role: "Data Analyst",    department: "Analytics",   status: "remote",     location: "Remoto",    joined: "2023-11", initials: "DL", color: "#8b5cf6", performance: 85 },
  { id: "e7", name: "Emma Wilson",     role: "DevOps Engineer", department: "Ingeniería",  status: "active",     location: "Madrid",    joined: "2022-03", initials: "EW", color: "#34d399", performance: 90 },
  { id: "e8", name: "Pablo Fernández", role: "Account Exec",    department: "Ventas",      status: "leave",      location: "Sevilla",   joined: "2023-07", initials: "PF", color: "#f97316", performance: 72 },
]

export const departmentHeadcount = [
  { dept: "Ingeniería", count: 98,  color: "#6366f1" },
  { dept: "Ventas",     count: 62,  color: "#10b981" },
  { dept: "Producto",   count: 34,  color: "#f59e0b" },
  { dept: "Diseño",     count: 28,  color: "#ec4899" },
  { dept: "Analytics",  count: 22,  color: "#06b6d4" },
  { dept: "RRHH",       count: 18,  color: "#8b5cf6" },
  { dept: "Finanzas",   count: 14,  color: "#f97316" },
  { dept: "Legal",      count: 8,   color: "#64748b" },
]
