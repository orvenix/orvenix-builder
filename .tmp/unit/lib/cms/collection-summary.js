"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmptyCmsWorkflowSummary = getEmptyCmsWorkflowSummary;
exports.summarizeCmsWorkflowRecords = summarizeCmsWorkflowRecords;
exports.mergeCmsWorkflowSummaries = mergeCmsWorkflowSummaries;
exports.getCmsWorkflowSummaryTone = getCmsWorkflowSummaryTone;
const workflow_1 = require("./workflow");
function getEmptyCmsWorkflowSummary() {
    return {
        total: 0,
        draft: 0,
        review: 0,
        published: 0,
    };
}
function summarizeCmsWorkflowRecords(records) {
    const summary = getEmptyCmsWorkflowSummary();
    for (const record of records) {
        const status = (0, workflow_1.getCmsWorkflowStatus)(record.data, record.publishedAt);
        summary.total += 1;
        summary[status] += 1;
    }
    return summary;
}
function mergeCmsWorkflowSummaries(summaries) {
    return summaries.reduce((acc, summary) => ({
        total: acc.total + summary.total,
        draft: acc.draft + summary.draft,
        review: acc.review + summary.review,
        published: acc.published + summary.published,
    }), getEmptyCmsWorkflowSummary());
}
function getCmsWorkflowSummaryTone(status) {
    if (status === "published")
        return "published";
    if (status === "review")
        return "review";
    return "neutral";
}
