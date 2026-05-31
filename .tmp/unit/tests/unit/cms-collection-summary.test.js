"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const collection_summary_1 = require("../../lib/cms/collection-summary");
(0, node_test_1.default)("cms collection summary counts draft review and published records", () => {
    const summary = (0, collection_summary_1.summarizeCmsWorkflowRecords)([
        { data: {}, publishedAt: null },
        { data: { __orvenix: { workflowStatus: "review" } }, publishedAt: null },
        { data: { __orvenix: { workflowStatus: "draft" } }, publishedAt: "2026-05-30T10:00:00.000Z" },
    ]);
    strict_1.default.deepEqual(summary, {
        total: 3,
        draft: 1,
        review: 1,
        published: 1,
    });
});
(0, node_test_1.default)("cms collection summary merge aggregates multiple collections", () => {
    const merged = (0, collection_summary_1.mergeCmsWorkflowSummaries)([
        { total: 4, draft: 2, review: 1, published: 1 },
        (0, collection_summary_1.getEmptyCmsWorkflowSummary)(),
        { total: 2, draft: 0, review: 1, published: 1 },
    ]);
    strict_1.default.deepEqual(merged, {
        total: 6,
        draft: 2,
        review: 2,
        published: 2,
    });
});
