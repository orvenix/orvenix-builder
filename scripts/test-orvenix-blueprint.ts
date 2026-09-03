import {
  applyBusinessContent,
  buildSiteArchitecture,
  compileSiteBlueprint,
  evaluateTreeQuality,
} from "@/lib/orvenix-ai"

const request =
  "Hazme un sitio para una clínica dental en Monterrey"

const business = {
  name: "Clínica Dental Monterrey",
  industry: "clínica dental",
  location: "Monterrey",
  objective: "Conseguir citas",
  phone: "81 0000 0000",
  whatsapp: "528100000000",
  email: "citas@clinicadental.mx",
  address: "Monterrey, Nuevo León",
}

const architecture = buildSiteArchitecture({
  request,
  business,
})

const rawBlueprint =
  compileSiteBlueprint(architecture)

const pages = rawBlueprint.pages.map(
  (page) => ({
    ...page,
    tree: applyBusinessContent(
      page.tree,
      {
        ...business,
        page: {
          name: page.name,
          slug: page.slug,
          purpose:
            architecture.pages.find(
              (candidate) =>
                candidate.slug === page.slug,
            )?.purpose,
        },
      },
    ),
  }),
)

console.log("================================")
console.log("ORVENIX AI — CONTENT BLUEPRINT")
console.log("================================")

for (const page of pages) {
  console.log("")
  console.log(`=== ${page.name} ===`)

  const quality =
    evaluateTreeQuality(page.tree)

  console.log("QUALITY:", quality.score)

  const root =
    page.tree.nodes[page.tree.rootId]

  for (const id of root?.children ?? []) {
    const node = page.tree.nodes[id]

    console.log("")
    console.log(
      `${node.type} — ${node.displayName ?? ""}`,
    )

    if (
      typeof node.props.title === "string"
    ) {
      console.log(
        "  title:",
        node.props.title,
      )
    }

    if (
      typeof node.props.description ===
      "string"
    ) {
      console.log(
        "  description:",
        node.props.description,
      )
    }

    if (
      typeof node.props.ctaLabel ===
      "string"
    ) {
      console.log(
        "  CTA:",
        node.props.ctaLabel,
      )
    }
  }
}
