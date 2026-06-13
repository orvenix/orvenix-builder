import test from "node:test"
import assert from "node:assert/strict"
import {
  parseCmsFilterGroup,
  applyCmsFilterGroup,
  opsForField,
  type CmsFilterGroup,
} from "../../lib/cms/filters"
import type { CmsFieldDef } from "../../lib/cms/schema"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(id: string, data: Record<string, unknown>) {
  return { id, data }
}

function textField(slug: string): CmsFieldDef {
  return { id: slug, name: slug, slug, type: "text", required: false }
}

function numberField(slug: string): CmsFieldDef {
  return { id: slug, name: slug, slug, type: "number", required: false }
}

// ─── parseCmsFilterGroup ─────────────────────────────────────────────────────

test("cms filters parseCmsFilterGroup returns null on empty input", () => {
  assert.equal(parseCmsFilterGroup(null), null)
  assert.equal(parseCmsFilterGroup(""), null)
  assert.equal(parseCmsFilterGroup("{}"), null)       // missing rules
  assert.equal(parseCmsFilterGroup("bad json"), null)
})

test("cms filters parseCmsFilterGroup parses valid AND group", () => {
  const input = JSON.stringify({
    logic: "and",
    rules: [{ field: "title", op: "contains", value: "hello" }],
  })
  const result = parseCmsFilterGroup(input)
  assert.ok(result !== null)
  assert.equal(result!.logic, "and")
  assert.equal(result!.rules.length, 1)
  assert.equal(result!.rules[0].field, "title")
  assert.equal(result!.rules[0].op, "contains")
})

test("cms filters parseCmsFilterGroup rejects invalid op", () => {
  const input = JSON.stringify({
    logic: "and",
    rules: [{ field: "title", op: "INVALID_OP", value: "x" }],
  })
  assert.equal(parseCmsFilterGroup(input), null)
})

// ─── applyCmsFilterGroup — text ops ──────────────────────────────────────────

test("cms filters eq on text field", () => {
  const records = [
    makeRecord("r1", { title: "Hello World" }),
    makeRecord("r2", { title: "Foo" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "eq", value: "Hello World" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

test("cms filters eq is case-insensitive for text", () => {
  const records = [makeRecord("r1", { title: "hello" }), makeRecord("r2", { title: "HELLO" })]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "eq", value: "hello" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.equal(result.length, 2)
})

test("cms filters contains", () => {
  const records = [
    makeRecord("r1", { title: "The quick brown fox" }),
    makeRecord("r2", { title: "Hello" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "contains", value: "quick" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

test("cms filters starts", () => {
  const records = [
    makeRecord("r1", { slug: "product-a" }),
    makeRecord("r2", { slug: "category-b" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "slug", op: "starts", value: "product" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

test("cms filters ends", () => {
  const records = [
    makeRecord("r1", { slug: "product-sale" }),
    makeRecord("r2", { slug: "product-full" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "slug", op: "ends", value: "sale" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

test("cms filters neq", () => {
  const records = [
    makeRecord("r1", { status: "active" }),
    makeRecord("r2", { status: "inactive" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "status", op: "neq", value: "inactive" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

// ─── applyCmsFilterGroup — number ops ────────────────────────────────────────

test("cms filters gt on number", () => {
  const records = [
    makeRecord("r1", { price: 100 }),
    makeRecord("r2", { price: 50 }),
    makeRecord("r3", { price: 200 }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "price", op: "gt", value: 99 }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1", "r3"])
})

test("cms filters lte on number", () => {
  const records = [
    makeRecord("r1", { price: 100 }),
    makeRecord("r2", { price: 50 }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "price", op: "lte", value: 50 }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r2"])
})

test("cms filters between on number", () => {
  const records = [
    makeRecord("r1", { price: 10 }),
    makeRecord("r2", { price: 50 }),
    makeRecord("r3", { price: 200 }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "price", op: "between", value: 20, value2: 100 }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r2"])
})

// ─── applyCmsFilterGroup — empty / notempty ───────────────────────────────────

test("cms filters empty detects null/undefined/empty string", () => {
  const records = [
    makeRecord("r1", { title: "" }),
    makeRecord("r2", { title: "Hello" }),
    makeRecord("r3", {}),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "empty" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1", "r3"])
})

test("cms filters notempty", () => {
  const records = [
    makeRecord("r1", { title: "Hello" }),
    makeRecord("r2", { title: "" }),
  ]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "notempty" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

// ─── applyCmsFilterGroup — AND / OR logic ─────────────────────────────────────

test("cms filters AND: all rules must match", () => {
  const records = [
    makeRecord("r1", { status: "active", price: 100 }),
    makeRecord("r2", { status: "active", price: 10 }),
    makeRecord("r3", { status: "inactive", price: 100 }),
  ]
  const group: CmsFilterGroup = {
    logic: "and",
    rules: [
      { field: "status", op: "eq", value: "active" },
      { field: "price", op: "gt", value: 50 },
    ],
  }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1"])
})

test("cms filters OR: any rule can match", () => {
  const records = [
    makeRecord("r1", { category: "shoes" }),
    makeRecord("r2", { category: "bags" }),
    makeRecord("r3", { category: "hats" }),
  ]
  const group: CmsFilterGroup = {
    logic: "or",
    rules: [
      { field: "category", op: "eq", value: "shoes" },
      { field: "category", op: "eq", value: "bags" },
    ],
  }
  const result = applyCmsFilterGroup(records, group)
  assert.deepEqual(result.map((r) => r.id), ["r1", "r2"])
})

// ─── applyCmsFilterGroup — edge cases ────────────────────────────────────────

test("cms filters passes all records when no filters match nothing unexpected", () => {
  const records = [makeRecord("r1", { title: "A" }), makeRecord("r2", { title: "B" })]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "notempty" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.equal(result.length, 2)
})

test("cms filters handles record with null data gracefully", () => {
  const records = [{ id: "r1", data: null as unknown as Record<string, unknown> }]
  const group: CmsFilterGroup = { logic: "and", rules: [{ field: "title", op: "empty" }] }
  const result = applyCmsFilterGroup(records, group)
  assert.equal(result.length, 1) // null data → all fields are blank → "empty" matches
})

// ─── opsForField ─────────────────────────────────────────────────────────────

test("cms filters opsForField returns text ops for text fields", () => {
  const ops = opsForField(textField("title"))
  assert.ok(ops.includes("contains"))
  assert.ok(ops.includes("starts"))
  assert.ok(!ops.includes("between"))
})

test("cms filters opsForField returns numeric ops for number fields", () => {
  const ops = opsForField(numberField("price"))
  assert.ok(ops.includes("gt"))
  assert.ok(ops.includes("between"))
  assert.ok(!ops.includes("contains"))
})
