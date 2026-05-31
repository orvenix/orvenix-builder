"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const bulk_actions_1 = require("../../lib/cms/bulk-actions");
function createRecord(id, status) {
    return {
        id,
        data: status === "draft" ? {} : { __orvenix: { workflowStatus: status } },
        publishedAt: status === "published" ? "2026-05-30T10:00:00.000Z" : null,
        workflowStatus: status,
    };
}
(0, node_test_1.default)("cms bulk actions summarizes selected workflow states", () => {
    const records = [
        createRecord("r1", "draft"),
        createRecord("r2", "review"),
        createRecord("r3", "published"),
    ];
    strict_1.default.deepEqual((0, bulk_actions_1.summarizeSelectedWorkflow)(records, ["r1", "r3"]), {
        total: 2,
        draft: 1,
        review: 0,
        published: 1,
    });
});
(0, node_test_1.default)("cms bulk actions applies workflow status to selected records only", () => {
    const records = [
        createRecord("r1", "draft"),
        createRecord("r2", "review"),
    ];
    const next = (0, bulk_actions_1.applyBulkWorkflowStatus)(records, ["r2"], "published", "2026-05-30T12:00:00.000Z");
    strict_1.default.equal(next[0].workflowStatus, "draft");
    strict_1.default.equal(next[1].workflowStatus, "published");
    strict_1.default.equal(next[1].publishedAt, "2026-05-30T12:00:00.000Z");
});
(0, node_test_1.default)("cms bulk actions removes selected records", () => {
    const records = [
        createRecord("r1", "draft"),
        createRecord("r2", "review"),
        createRecord("r3", "published"),
    ];
    const next = (0, bulk_actions_1.removeBulkSelectedRecords)(records, ["r1", "r3"]);
    strict_1.default.deepEqual(next.map((record) => record.id), ["r2"]);
});
