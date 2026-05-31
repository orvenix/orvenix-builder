import test from "node:test"
import assert from "node:assert/strict"
import {
  getExportNavMarkupModel,
  getExportPlaceholderMarkupModel,
} from "../../lib/builder-core/compiler/exportMarkup"
import type { EditorNode } from "../../types/editor"

function createNode(overrides: Partial<EditorNode>): EditorNode {
  return {
    id: "node_markup",
    type: "landing-hero",
    version: 1,
    parentId: null,
    children: [],
    hidden: false,
    displayName: undefined,
    props: {},
    ...overrides,
  }
}

test("compiler export markup resolves nav links and active state", () => {
  const nav = getExportNavMarkupModel(
    {
      title: "Menu principal",
      layout: "row",
      justify: "end",
      variant: "minimal",
    },
    {
      siteId: "site_demo",
      currentPageSlug: "contacto",
      pages: [
        { id: "home", siteId: "site_demo", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page" },
        { id: "contacto", siteId: "site_demo", name: "Contacto", slug: "contacto", isHome: false, published: true, source: "site-page" },
      ],
    }
  )

  assert.equal(nav.ariaLabel, "Menu principal")
  assert.equal(nav.navClass, "site-nav site-nav--row site-nav--end site-nav--minimal")
  assert.equal(nav.hasLinks, true)
  assert.equal(nav.links[1]?.href, "/contacto/index.html")
  assert.equal(nav.links[1]?.isActive, true)
})

test("compiler export markup resolves placeholder metadata and defaults", () => {
  const complex = getExportPlaceholderMarkupModel(createNode({
    type: "landing-hero",
  }))
  const unknown = getExportPlaceholderMarkupModel(createNode({
    type: "custom-widget",
    displayName: "Widget custom",
  }))

  assert.equal(complex.tag, "header")
  assert.equal(complex.headingId, "landing-hero-heading")
  assert.equal(complex.meta?.label, "Hero principal")
  assert.equal(unknown.tag, "section")
  assert.equal(unknown.label, "Widget custom")
  assert.equal(unknown.meta, null)
})
