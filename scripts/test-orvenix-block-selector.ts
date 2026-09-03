import {
  rankBlocksForRole,
  type SectionRole,
} from "@/lib/orvenix-ai"

const roles: SectionRole[] = [
  "hero",
  "trust",
  "services",
  "features",
  "gallery",
  "products",
  "testimonials",
  "process",
  "faq",
  "contact",
  "cta",
  "footer",
]

for (const role of roles) {
  const ranked = rankBlocksForRole(role)

  console.log("")
  console.log("==========================")
  console.log(role.toUpperCase())
  console.log("==========================")

  for (const entry of ranked.slice(0, 5)) {
    console.log(
      `${String(entry.score).padStart(4)}  ${entry.block.type.padEnd(28)} ${entry.block.label}`
    )
  }
}
