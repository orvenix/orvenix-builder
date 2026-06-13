import test from "node:test"
import assert from "node:assert/strict"
import { collectCmsBackRelations } from "../../lib/cms/back-relations"
import type { CmsFieldDef } from "../../lib/cms/schema"

const relationField = (overrides: Partial<CmsFieldDef> = {}): CmsFieldDef => ({
  id: "author",
  name: "Autor",
  slug: "author",
  type: "relation",
  required: false,
  relation: { collectionSlug: "authors", multiple: false },
  ...overrides,
})

test("cms back relations collects a simple incoming relation", () => {
  const result = collectCmsBackRelations(
    "authors",
    [{ id: "author-1", data: { name: "Ada" } }],
    [{
      name: "Posts",
      slug: "posts",
      fields: [
        { id: "title", name: "Titulo", slug: "title", type: "text", required: false },
        relationField(),
      ],
      records: [{ id: "post-1", data: { title: "Hola", author: "author-1" } }],
    }]
  )

  assert.equal(result["author-1"].length, 1)
  assert.equal(result["author-1"][0].collectionSlug, "posts")
  assert.equal(result["author-1"][0].items[0].label, "Hola")
})

test("cms back relations collects multiple incoming relation values", () => {
  const result = collectCmsBackRelations(
    "authors",
    [{ id: "author-1", data: {} }, { id: "author-2", data: {} }],
    [{
      name: "Posts",
      slug: "posts",
      fields: [relationField({ id: "authors", name: "Autores", slug: "authors", relation: { collectionSlug: "authors", multiple: true } })],
      records: [{ id: "post-1", data: { authors: ["author-1", "author-2"] } }],
    }]
  )

  assert.equal(result["author-1"][0].items.length, 1)
  assert.equal(result["author-2"][0].items.length, 1)
})

test("cms back relations ignores relations to other collections", () => {
  const result = collectCmsBackRelations(
    "authors",
    [{ id: "author-1", data: {} }],
    [{
      name: "Posts",
      slug: "posts",
      fields: [relationField({ relation: { collectionSlug: "categories", multiple: false } })],
      records: [{ id: "post-1", data: { author: "author-1" } }],
    }]
  )

  assert.deepEqual(result["author-1"], [])
})
