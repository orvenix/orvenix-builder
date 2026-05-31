import { Flame, Dumbbell, Heart, Zap, Wind, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface Clase {
  id: string
  icon: LucideIcon
  name: string
  desc: string
  nivel: "Principiante" | "Intermedio" | "Avanzado" | "Todos"
  duracion: string
  capacidad: string
  color: string
  border: string
  bg: string
}

export const clases: Clase[] = [
  {
    id: "crossfit",
    icon: Flame,
    name: "CrossFit",
    desc: "Entrenamiento funcional de alta intensidad combinando levantamiento olímpico, gimnasia y cardio metabólico. Quema hasta 800 kcal por sesión.",
    nivel: "Intermedio",
    duracion: "60 min",
    capacidad: "16 personas",
    color: "text-red-400",
    border: "border-red-800/30",
    bg: "bg-red-950/15",
  },
  {
    id: "fuerza",
    icon: Dumbbell,
    name: "Fuerza & Potencia",
    desc: "Programas de hipertrofia y fuerza máxima con periodización. Ideal para quienes buscan ganar músculo y mejorar rendimiento.",
    nivel: "Todos",
    duracion: "75 min",
    capacidad: "12 personas",
    color: "text-orange-400",
    border: "border-orange-800/30",
    bg: "bg-orange-950/15",
  },
  {
    id: "yoga",
    icon: Wind,
    name: "Yoga Flow",
    desc: "Práctica dinámica de vinyasa con enfoque en flexibilidad, equilibrio y reducción de estrés. Apta para todos los niveles.",
    nivel: "Todos",
    duracion: "60 min",
    capacidad: "20 personas",
    color: "text-emerald-400",
    border: "border-emerald-800/30",
    bg: "bg-emerald-950/15",
  },
  {
    id: "boxeo",
    icon: Zap,
    name: "Box Fitness",
    desc: "Técnica de boxeo aplicada al acondicionamiento físico. Combinación de sombra, costal y trabajo en parejas. Sin contacto al rostro.",
    nivel: "Principiante",
    duracion: "55 min",
    capacidad: "14 personas",
    color: "text-yellow-400",
    border: "border-yellow-800/30",
    bg: "bg-yellow-950/15",
  },
  {
    id: "cardio",
    icon: Heart,
    name: "Cardio HIIT",
    desc: "Intervalos de alta intensidad con recuperación activa. Máxima quema calórica en el menor tiempo. Variedad de ejercicios cada sesión.",
    nivel: "Intermedio",
    duracion: "45 min",
    capacidad: "20 personas",
    color: "text-pink-400",
    border: "border-pink-800/30",
    bg: "bg-pink-950/15",
  },
  {
    id: "pilates",
    icon: Activity,
    name: "Pilates Reformer",
    desc: "Trabajo profundo de core, postura y movilidad en máquina reformer. Recuperación activa, ideal como complemento a otros entrenamientos.",
    nivel: "Todos",
    duracion: "50 min",
    capacidad: "8 personas",
    color: "text-violet-400",
    border: "border-violet-800/30",
    bg: "bg-violet-950/15",
  },
]

export const horario: Record<string, string[][]> = {
  "Lunes": [["06:00","CrossFit"],["07:30","Fuerza"],["09:00","Yoga"],["18:00","CrossFit"],["19:30","Box Fitness"],["21:00","HIIT"]],
  "Martes": [["07:00","Pilates"],["09:00","Fuerza"],["10:30","Yoga"],["17:30","HIIT"],["19:00","CrossFit"],["20:30","Fuerza"]],
  "Miércoles": [["06:00","CrossFit"],["07:30","Box Fitness"],["09:00","Pilates"],["18:00","Fuerza"],["19:30","Yoga"],["21:00","CrossFit"]],
  "Jueves": [["07:00","HIIT"],["09:00","Fuerza"],["10:30","Pilates"],["17:30","CrossFit"],["19:00","Box Fitness"],["20:30","HIIT"]],
  "Viernes": [["06:00","Fuerza"],["07:30","CrossFit"],["09:00","Yoga"],["18:00","HIIT"],["19:30","Fuerza"],["21:00","Box Fitness"]],
  "Sábado": [["08:00","CrossFit"],["09:30","Yoga"],["11:00","Fuerza"],["12:30","HIIT"]],
  "Domingo": [["09:00","Yoga"],["10:30","Pilates"],["12:00","Box Fitness"]],
}

export const statsGimnasio = [
  { value: "1,200+", label: "Miembros activos" },
  { value: "38", label: "Clases por semana" },
  { value: "12", label: "Entrenadores certificados" },
  { value: "8 años", label: "En el mercado" },
]
