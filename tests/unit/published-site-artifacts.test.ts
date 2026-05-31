import test from "node:test"
import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import path from "node:path"
import {
  getPublishedSitePublicPath,
  hasPublishedSiteArtifact,
  removePublishedSiteArtifact,
  writePublishedSiteArtifacts,
} from "../../lib/publishedSiteArtifacts"
import type { EditorTree } from "../../types/editor"

function createTree(title: string): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["title", "nav"],
        version: 1,
      },
      title: {
        id: "title",
        type: "heading",
        props: {
          level: 1,
          text: title,
        },
        children: [],
        version: 1,
        parentId: "root",
      },
      nav: {
        id: "nav",
        type: "siteNav",
        props: {
          title: "Principal",
        },
        children: [],
        version: 1,
        parentId: "root",
      },
    },
    theme: {
      colors: {
        primary: "#2563eb",
        secondary: "#0f172a",
        background: "#ffffff",
        text: "#0f172a",
        accent: "#22c55e",
      },
      fontHeading: "Sora",
      fontBody: "Inter",
    },
  }
}

test("static published artifacts write home and nested pages with shared css", async () => {
  const siteId = "test-static-runtime"

  await removePublishedSiteArtifact(siteId)

  try {
    await writePublishedSiteArtifacts(
      siteId,
      [
        { slug: "home", name: "Inicio", tree: createTree("Inicio"), isHome: true },
        { slug: "servicios", name: "Servicios", tree: createTree("Servicios"), isHome: false },
      ],
      [
        {
          id: "page-home",
          siteId,
          name: "Inicio",
          slug: "home",
          isHome: true,
          published: true,
          source: "site-page",
        },
        {
          id: "page-services",
          siteId,
          name: "Servicios",
          slug: "servicios",
          isHome: false,
          published: true,
          source: "site-page",
        },
      ]
    )

    assert.equal(await hasPublishedSiteArtifact(siteId), true)
    assert.equal(await hasPublishedSiteArtifact(siteId, "servicios"), true)
    assert.equal(getPublishedSitePublicPath(siteId), `/published-sites/${siteId}/`)
    assert.equal(getPublishedSitePublicPath(siteId, "servicios"), `/published-sites/${siteId}/servicios/`)

    const homeHtml = await fs.readFile(
      path.join(process.cwd(), "public", "published-sites", siteId, "index.html"),
      "utf8"
    )
    const servicesHtml = await fs.readFile(
      path.join(process.cwd(), "public", "published-sites", siteId, "servicios", "index.html"),
      "utf8"
    )

    assert.match(homeHtml, /href="\/servicios\/index\.html"/)
    assert.match(servicesHtml, /href="\/index\.html"/)
    assert.match(servicesHtml, /\.\.\/styles\.css/)
  } finally {
    await removePublishedSiteArtifact(siteId)
  }
})
