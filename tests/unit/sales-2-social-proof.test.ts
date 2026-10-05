import test from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { readFileSync } from "node:fs"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")

/*
 * SALES-2 / decision 5: public commercial surfaces carry no social proof that
 * the repository cannot back up (counters, ratings, testimonials or case
 * results presented as real). Nothing replaces them with another number.
 */

const UNVERIFIABLE = [
  /150\+/,
  /45\+/,
  /98%/,
  /24\+/,
  /clientes reales/i,
  /Webs reales/,
  /★★★★★/,
  /fill-yellow-400/,
  /Proyectos completados|Clientes satisfechos|Tasa de satisfacción|Guías publicadas/,
]

const PUBLIC_SURFACES = [
  "app/page.tsx",
  "components/marketing/home/Hero.tsx",
  "app/templates/page.tsx",
  "app/precios/page.tsx",
  "app/about/page.tsx",
  "app/blog/page.tsx",
  "app/portafolio/page.tsx",
  "components/marketing/Navbar.tsx",
  "components/marketing/Footer.tsx",
]

test("SALES-2: public commercial surfaces carry no unverifiable counters, ratings or 'real clients' claims", () => {
  for (const file of PUBLIC_SURFACES) {
    const source = read(file)
    for (const pattern of UNVERIFIABLE) assert.doesNotMatch(source, pattern, `${file} ${pattern}`)
  }
})

test("SALES-2: the landing no longer renders the fictional testimonials or case studies", () => {
  const home = read("app/page.tsx")
  assert.doesNotMatch(home, /<Testimonials|<Portfolio|home\/Testimonials|home\/Portfolio/)
})

test("SALES-2: the fabricated portfolio page sends visitors to the Orvenix designs and is out of the navigation", () => {
  const page = read("app/portafolio/page.tsx")
  assert.match(page, /redirect\('\/templates'\)/)
  assert.doesNotMatch(page, /\+340%|usuarios activos|descargas/)
  assert.doesNotMatch(read("components/marketing/Navbar.tsx"), /\/portafolio/)
  assert.doesNotMatch(read("components/marketing/Footer.tsx"), /\/portafolio/)
})

test("SALES-2: the hero keeps only offer facts (SLA target, guided activation), no project counter", () => {
  const hero = read("components/marketing/home/Hero.tsx")
  assert.match(hero, /<StatItem value="99\.9%" label="Uptime objetivo" \/>/)
  assert.doesNotMatch(hero, /Proyectos completados/)
  assert.doesNotMatch(read("lib/constructorPresets.ts"), /150\+? proyectos|4\.9\/5/)
  assert.doesNotMatch(read("app/about/page.tsx"), /\d+ proyectos|\d+ clientes/)
})
