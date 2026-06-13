import assert from "node:assert/strict"
import test from "node:test"
import {
  CMS_RECORDS_MAX_PAGE_SIZE,
  CMS_RECORDS_PAGE_SIZE,
  getCmsRecordsPageCount,
  parseCmsRecordsPagination,
} from "../../lib/cms/pagination"

test("cms pagination uses stable defaults", () => {
  assert.deepEqual(parseCmsRecordsPagination(null, null), {
    page: 1,
    limit: CMS_RECORDS_PAGE_SIZE,
    offset: 0,
  })
})

test("cms pagination computes offset for later pages", () => {
  assert.deepEqual(parseCmsRecordsPagination("3", "25"), {
    page: 3,
    limit: 25,
    offset: 50,
  })
})

test("cms pagination rejects invalid values and caps large pages", () => {
  assert.deepEqual(parseCmsRecordsPagination("-2", "not-a-number"), {
    page: 1,
    limit: CMS_RECORDS_PAGE_SIZE,
    offset: 0,
  })
  assert.equal(parseCmsRecordsPagination("1", "999").limit, CMS_RECORDS_MAX_PAGE_SIZE)
})

test("cms pagination page count keeps an empty view on page one", () => {
  assert.equal(getCmsRecordsPageCount(0), 1)
  assert.equal(getCmsRecordsPageCount(201, 100), 3)
})
