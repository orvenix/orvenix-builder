import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { extractDesignReference } from "../../lib/orvenix-ai/design-reference/extract"
import { findSanitizationViolations, assertSanitizedDesignReference } from "../../lib/orvenix-ai/design-reference/sanitize"

/**
 * These fixtures deliberately mirror the fabricated-fact-heavy shape of
 * the REAL app/webs demo pages (named staff, star ratings, phone/email,
 * prices, "years of experience" claims, hotlinked Unsplash URLs) so the
 * sanitization boundary is proven against realistic content, not a toy
 * case -- without duplicating any real app/webs source into the test
 * tree.
 */
const FAKE_DOCTOR_NAME = "Alejandro Ramírez"
const FAKE_PHONE = "+52 55 4000 0000"
const FAKE_EMAIL = "contacto@fake-demo-clinic.mx"
const FAKE_PRICE = "$1,490"
const FAKE_YEARS_CLAIM = "15 años de experiencia"
const FAKE_CERTIFICATION = "Certificación ISO 9001 y JCI"
const FAKE_RATING = "4.9 estrellas"
const FAKE_IMAGE_URL = "https://images.unsplash.com/photo-1234567890-fakefakefake?w=1600"

function buildFixture(): { dirPath: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "design-reference-sanitization-"))
  const dirPath = join(root, "fake-clinic")
  mkdirSync(dirPath)
  mkdirSync(join(dirPath, "medicos"))
  mkdirSync(join(dirPath, "contacto"))

  const pageContent = `
"use client"
import { useState } from "react"
import { Star, Shield } from "lucide-react"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"

const doctors = [
  { name: "Dr. ${FAKE_DOCTOR_NAME}", rating: 4.9, reviews: 812, specialty: "Fisioterapia" },
]

export default function FakeClinicPage() {
  const [cita, setCita] = useState({ nombre: "", telefono: "", fecha: "" })
  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <EnhancedSiteNav brand={{ name: "FakeClinic" }} links={[]} cta={{ href: "#cita", label: "Agendar" }} Icon={Shield} theme={{}} />
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('${FAKE_IMAGE_URL}')] bg-cover" />
        <div className="blur-[150px] rounded-full" />
        <h1 className="text-7xl font-black bg-clip-text text-transparent">Tu salud es lo primero</h1>
        <p className="text-white/35">${FAKE_YEARS_CLAIM}. ${FAKE_CERTIFICATION}.</p>
        <div className="inline-flex rounded-full bg-teal-900/40"><Shield /> ${FAKE_CERTIFICATION}</div>
      </section>
      {/* Medicos */}
      <section id="medicos" className="py-24">
        {doctors.map((d) => (
          <div key={d.name} className="rounded-2xl border p-5">
            <h3>{d.name}</h3>
            <Star /> {d.rating} (${FAKE_RATING}, {d.reviews} reseñas)
          </div>
        ))}
      </section>
      {/* Contacto */}
      <section id="contacto" className="py-16">
        <p>Llámanos: ${FAKE_PHONE} · ${FAKE_EMAIL}</p>
        <p>Planes desde ${FAKE_PRICE}</p>
      </section>
      {/* Footer */}
      <section id="footer" className="py-8">
        <p>FakeClinic © 2026</p>
      </section>
    </div>
  )
}
`
  writeFileSync(join(dirPath, "page.tsx"), pageContent, "utf8")

  return { dirPath, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

test("14) known fabricated ratings/stats/certification-shaped values do not survive extraction", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    const serialized = JSON.stringify(reference)
    assert.equal(serialized.includes(FAKE_RATING), false)
    assert.equal(serialized.includes(FAKE_YEARS_CLAIM), false)
    assert.equal(serialized.includes(FAKE_CERTIFICATION), false)
    assert.equal(serialized.includes(FAKE_PRICE), false)
    assert.equal(serialized.includes("4.9"), false)
    assert.equal(serialized.includes("812"), false)
  } finally {
    cleanup()
  }
})

test("15) known demo person names do not survive extraction", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    const serialized = JSON.stringify(reference)
    assert.equal(serialized.includes(FAKE_DOCTOR_NAME), false)
    assert.equal(serialized.includes("Dr. "), false)
  } finally {
    cleanup()
  }
})

test("contact details (phone/email) and prices do not survive extraction", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    const serialized = JSON.stringify(reference)
    assert.equal(serialized.includes(FAKE_PHONE), false)
    assert.equal(serialized.includes(FAKE_EMAIL), false)
    assert.equal(serialized.includes("fake-demo-clinic"), false)
  } finally {
    cleanup()
  }
})

test("no literal image URL survives extraction, and the record passes the sanitization boundary", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    const serialized = JSON.stringify(reference)
    assert.equal(serialized.includes(FAKE_IMAGE_URL), false)
    assert.equal(serialized.includes("unsplash"), false)
    assert.equal(serialized.includes("http"), false)

    const violations = findSanitizationViolations(reference)
    assert.deepEqual(violations, [])
    assert.doesNotThrow(() => assertSanitizedDesignReference(reference))
  } finally {
    cleanup()
  }
})

test("reference records built from the fixture contain no raw JSX/source tokens", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    const serialized = JSON.stringify(reference)
    assert.equal(/<section|<div|className=|useState\(/.test(serialized), false)
  } finally {
    cleanup()
  }
})

test("fixture still yields meaningful bounded grammar (sanity: sanitization isn't just erasing everything)", () => {
  const { dirPath, cleanup } = buildFixture()
  try {
    const reference = extractDesignReference({ slug: "fake-clinic", dirPath })
    assert.equal(reference.heroGrammar.mediaStrategy, "photography")
    assert.equal(reference.distinctiveTraits.includes("rated-person-card"), true)
    assert.ok(reference.sectionGrammar.roleSequence.length > 0)
  } finally {
    cleanup()
  }
})
