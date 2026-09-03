import {
  getBlockCapabilities,
  getSiteCapabilities,
} from "@/lib/orvenix-ai"

const blocks = getBlockCapabilities()
const capabilities = getSiteCapabilities()

console.log("=== ORVENIX AI CAPABILITIES ===")
console.log("Bloques:", blocks.length)
console.log("Categorías:", capabilities.categories.length)

console.log("")
console.log("=== PRIMEROS BLOQUES ===")

for (const block of blocks.slice(0, 15)) {
  console.log({
    type: block.type,
    label: block.label,
    category: block.category,
    settings: block.settings.length,
    acceptsChildren: block.acceptsChildren,
  })
}

console.log("")
console.log("=== FEATURES ===")
console.log(capabilities.supports)
