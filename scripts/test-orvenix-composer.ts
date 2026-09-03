import {
  composeSection,
  type SectionRole,
} from "@/lib/orvenix-ai"

const roles: SectionRole[] = [
  "trust",
  "gallery",
  "faq",
]

for (const role of roles) {
  const result = composeSection(role)

  console.log("")
  console.log("========================")
  console.log(role.toUpperCase())
  console.log("========================")

  if (!result) {
    console.log("SIN COMPOSICIÓN")
    continue
  }

  console.log("ROOT:", result.rootId)
  console.log(
    "NODOS:",
    Object.keys(result.nodes).length,
  )

  for (const node of Object.values(result.nodes)) {
    console.log(
      `${node.type.padEnd(18)} ${node.displayName}`
    )
  }
}
