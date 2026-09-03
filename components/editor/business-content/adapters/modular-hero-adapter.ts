import type { HeroBusinessAdapter } from "../types"

export const modularHeroAdapter: HeroBusinessAdapter = {
  nodeTypes: ["modular-hero"],

  read: (node) => ({
    eyebrow:
      typeof node.props.eyebrow === "string"
        ? node.props.eyebrow
        : "Arquitectura SaaS modular",

    title:
      typeof node.props.title === "string"
        ? node.props.title
        : "Una web empresarial lista para escalar, vender y operar",

    subtitle:
      typeof node.props.subtitle === "string"
        ? node.props.subtitle
        : "Sistema completo con secciones editables, narrativa comercial, componentes reutilizables y un flujo de contacto preparado para convertir oportunidades.",

    primaryButton:
      typeof node.props.primaryCta === "string"
        ? node.props.primaryCta
        : "Solicitar demo",

    secondaryButton:
      typeof node.props.secondaryCta === "string"
        ? node.props.secondaryCta
        : "Ver arquitectura",
  }),

  write: (currentProps, content) => ({
    ...currentProps,
    eyebrow: content.eyebrow ?? "",
    title: content.title,
    subtitle: content.subtitle ?? "",
    primaryCta: content.primaryButton ?? "",
    secondaryCta: content.secondaryButton ?? "",
  }),
}
