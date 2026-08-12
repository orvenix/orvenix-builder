import type { HeroBusinessAdapter } from "../types"

export const agencyHeroAdapter: HeroBusinessAdapter = {
  nodeTypes: ["agency-hero"],

  read: (node) => ({
    title:
      typeof node.props.title === "string"
        ? node.props.title
        : "Ecosistemas digitales de alto impacto",

    subtitle:
      typeof node.props.subtitle === "string"
        ? node.props.subtitle
        : "Diseñamos y desarrollamos productos digitales que escalan tu autoridad y facturación.",
  }),

  write: (currentProps, content) => ({
    ...currentProps,
    title: content.title,
    subtitle: content.subtitle ?? "",
  }),
}
