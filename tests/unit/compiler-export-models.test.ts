import test from "node:test"
import assert from "node:assert/strict"
import {
  getExportButtonModel,
  getExportHeadingModel,
  getExportImageModel,
  getExportLayoutModel,
  getExportPlaceholderModel,
  getExportTextModel,
} from "../../lib/builder-core/compiler/exportModels"
import type { EditorNode } from "../../types/editor"

function createNode(overrides: Partial<EditorNode>): EditorNode {
  return {
    id: "node_1",
    type: "genericWrapper",
    version: 1,
    parentId: null,
    children: [],
    hidden: false,
    displayName: undefined,
    props: {},
    ...overrides,
  }
}

test("compiler export models resolves layout and heading models", () => {
  const layout = getExportLayoutModel(createNode({
    type: "section",
    props: { maxWidth: "xl" },
  }))
  const heading = getExportHeadingModel(createNode({
    type: "heading",
    props: { level: 9, text: "Hola", align: "center" },
  }))

  assert.deepEqual(layout, { tag: "section", maxWidth: "xl" })
  assert.equal(heading.tag, "h6")
  assert.equal(heading.text, "Hola")
  assert.equal(heading.alignClass, "text-center")
})

test("compiler export models resolves text, button and image models", () => {
  const text = getExportTextModel(createNode({
    type: "text",
    props: { content: "Linea 1\nLinea 2", align: "end" },
  }))
  const button = getExportButtonModel(createNode({
    type: "ctaButton",
    props: { href: "page:servicios", label: "Ver servicios", variant: "secondary" },
  }), "site_demo")
  const image = getExportImageModel(createNode({
    type: "image",
    props: { src: "/hero.png", alt: "Hero", width: 1200, height: 700, objectFit: "cover", title: "Portada" },
  }))

  assert.equal(text.alignClass, "text-end")
  assert.equal(button.href, "/servicios/index.html")
  assert.equal(button.className, "cta-button cta-button--secondary")
  assert.equal(button.isExternal, false)
  assert.equal(image.caption, "Portada")
  assert.equal(image.objectFitCover, true)
  assert.equal(image.width, 1200)
})

test("compiler export models resolves placeholder metadata for complex and unknown blocks", () => {
  const complex = getExportPlaceholderModel(createNode({
    type: "landing-hero",
  }))
  const unknown = getExportPlaceholderModel(createNode({
    type: "custom-widget",
    displayName: "Widget custom",
  }))

  assert.equal(complex.className, "orv-block orv-block--landing-hero")
  assert.equal(complex.meta?.tag, "header")
  assert.equal(unknown.label, "Widget custom")
  assert.equal(unknown.meta, null)
})
