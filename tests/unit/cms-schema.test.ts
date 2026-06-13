import test from "node:test"
import assert from "node:assert/strict"
import {
  CmsFieldsSchema,
  validateCmsRecordData,
  type CmsFieldDef,
} from "../../lib/cms/schema"

function field(overrides: Partial<CmsFieldDef> = {}): CmsFieldDef {
  return {
    id: "title",
    name: "Titulo",
    slug: "title",
    type: "text",
    required: false,
    ...overrides,
  }
}

test("cms schema accepts a valid field list", () => {
  const parsed = CmsFieldsSchema.safeParse([
    field(),
    field({ id: "price", name: "Precio", slug: "price", type: "number", min: 0, max: 100 }),
  ])
  assert.equal(parsed.success, true)
})

test("cms schema rejects duplicate field slugs", () => {
  const parsed = CmsFieldsSchema.safeParse([
    field(),
    field({ id: "other", name: "Otro titulo" }),
  ])
  assert.equal(parsed.success, false)
})

test("cms schema requires select options", () => {
  const parsed = CmsFieldsSchema.safeParse([
    field({ type: "select", options: undefined }),
  ])
  assert.equal(parsed.success, false)
})

test("cms schema rejects inverted numeric ranges", () => {
  const parsed = CmsFieldsSchema.safeParse([
    field({ type: "number", min: 10, max: 5 }),
  ])
  assert.equal(parsed.success, false)
})

test("cms record validation requires configured fields", () => {
  const result = validateCmsRecordData([field({ required: true })], {})
  assert.equal(result.valid, false)
  assert.equal(result.errors[0]?.fieldSlug, "title")
})

test("cms record validation enforces numeric min and max", () => {
  const price = field({ id: "price", name: "Precio", slug: "price", type: "number", min: 10, max: 20 })
  assert.equal(validateCmsRecordData([price], { price: "9" }).valid, false)
  assert.equal(validateCmsRecordData([price], { price: "21" }).valid, false)
  assert.equal(validateCmsRecordData([price], { price: "15" }).valid, true)
})

test("cms record validation enforces maxLength", () => {
  const title = field({ maxLength: 4 })
  assert.equal(validateCmsRecordData([title], { title: "cinco" }).valid, false)
  assert.equal(validateCmsRecordData([title], { title: "ok" }).valid, true)
})

test("cms record validation rejects unknown select option", () => {
  const status = field({
    id: "status",
    name: "Estado",
    slug: "status",
    type: "select",
    options: ["draft", "published"],
  })
  assert.equal(validateCmsRecordData([status], { status: "archived" }).valid, false)
  assert.equal(validateCmsRecordData([status], { status: "draft" }).valid, true)
})
