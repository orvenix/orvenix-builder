import { BrainCircuit, Zap, Shield, Globe, BarChart3, Users } from "lucide-react"
import type { Feature } from "../types"

export const features: Feature[] = [
  { icon: BrainCircuit, title: "IA que trabaja para ti",     colorKey: "indigo",  tag: "AI-Powered",  description: "Automatización inteligente que aprende de tus patrones y optimiza procesos sin intervención manual. Toma mejores decisiones con insights generados por IA." },
  { icon: Zap,          title: "Velocidad extrema",          colorKey: "amber",   tag: "Performance", description: "Infraestructura edge-first con menos de 50ms de latencia global. Construida sobre la red más rápida del mundo para garantizar la mejor experiencia." },
  { icon: Shield,       title: "Seguridad enterprise",       colorKey: "emerald", tag: "Security",    description: "SOC 2 Type II, ISO 27001, GDPR compliant. Encriptación end-to-end, SSO, auditoría completa y controles de acceso granulares." },
  { icon: Globe,        title: "Multi-región nativo",        colorKey: "blue",    tag: "Global",      description: "Despliega en 25+ regiones globales con failover automático. Tus datos siempre disponibles donde tu equipo los necesita." },
  { icon: BarChart3,    title: "Analytics avanzado",         colorKey: "violet",  tag: "Analytics",   description: "Visualiza el performance de tu negocio con dashboards configurables, reportes automáticos y alertas inteligentes en tiempo real." },
  { icon: Users,        title: "Colaboración sin límites",   colorKey: "cyan",    tag: "Team",        description: "Espacios de trabajo compartidos, permisos granulares y flujos de aprobación. Tu equipo, siempre alineado sin importar la zona horaria." },
]

export const statsStrip = [
  { value: "99.99%", label: "Uptime SLA garantizado" },
  { value: "<50ms",  label: "Latencia P99 global" },
  { value: "25+",    label: "Regiones de deployment" },
  { value: "SOC2",   label: "Certificación de seguridad" },
]
