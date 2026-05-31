import test from "node:test"
import assert from "node:assert/strict"
import {
  getComplexBlockMeta,
  resolveExportHref,
  resolveExportNavModel,
} from "../../lib/builder-core/compiler/exportNodes"

test("compiler export nodes resolves internal export hrefs", () => {
  assert.equal(resolveExportHref("site_demo", "page:home"), "/index.html")
  assert.equal(resolveExportHref("site_demo", "page:servicios"), "/servicios/index.html")
  assert.equal(resolveExportHref("site_demo", "https://orvenix.com.mx"), "https://orvenix.com.mx")
})

test("compiler export nodes resolves site nav model with active page", () => {
  const model = resolveExportNavModel(
    {
      title: "Principal",
      layout: "row",
      justify: "center",
      variant: "pill",
    },
    {
      siteId: "site_demo",
      currentPageSlug: "servicios",
      pages: [
        {
          id: "home",
          siteId: "site_demo",
          name: "Inicio",
          slug: "home",
          isHome: true,
          published: true,
          source: "site-page",
        },
        {
          id: "services",
          siteId: "site_demo",
          name: "Servicios",
          slug: "servicios",
          isHome: false,
          published: true,
          source: "site-page",
        },
      ],
    }
  )

  assert.equal(model.ariaLabel, "Principal")
  assert.equal(model.navClass, "site-nav site-nav--row site-nav--center site-nav--pill")
  assert.equal(model.links.length, 2)
  assert.equal(model.links[1]?.href, "/servicios/index.html")
  assert.equal(model.links[1]?.isActive, true)
})

test("compiler export nodes exposes complex block metadata", () => {
  const meta = getComplexBlockMeta("landing-hero")
  assert.ok(meta)
  assert.equal(meta?.tag, "header")
  assert.equal(meta?.heading, "Hero principal")
  assert.equal(getComplexBlockMeta("unknown-widget"), null)
})
