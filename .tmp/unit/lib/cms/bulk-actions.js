"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeSelectedWorkflow = summarizeSelectedWorkflow;
exports.applyBulkWorkflowStatus = applyBulkWorkflowStatus;
exports.removeBulkSelectedRecords = removeBulkSelectedRecords;
const workflow_1 = require("./workflow");
function summarizeSelectedWorkflow(records, selectedIds) {
    var _a;
    const idSet = new Set(selectedIds);
    const summary = {
        total: 0,
        draft: 0,
        review: 0,
        published: 0,
    };
    for (const record of records) {
        if (!idSet.has(record.id))
            continue;
        const status = (_a = record.workflowStatus) !== null && _a !== void 0 ? _a : (0, workflow_1.getCmsWorkflowStatus)(record.data, record.publishedAt);
        summary.total += 1;
        summary[status] += 1;
    }
    return summary;
}
function applyBulkWorkflowStatus(records, selectedIds, workflowStatus, publishedAtValue = new Date().toISOString()) {
    const idSet = new Set(selectedIds);
    return records.map((record) => {
        if (!idSet.has(record.id))
            return record;
        return Object.assign(Object.assign({}, record), { data: (0, workflow_1.withCmsWorkflowStatus)(record.data, workflowStatus), publishedAt: workflowStatus === "published" ? publishedAtValue : null, workflowStatus });
    });
}
function removeBulkSelectedRecords(records, selectedIds) {
    const idSet = new Set(selectedIds);
    return records.filter((record) => !idSet.has(record.id));
}
