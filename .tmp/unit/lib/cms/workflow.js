"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMS_WORKFLOW_STATUSES = exports.CMS_WORKFLOW_META_KEY = void 0;
exports.isCmsWorkflowStatus = isCmsWorkflowStatus;
exports.getCmsWorkflowStatus = getCmsWorkflowStatus;
exports.withCmsWorkflowStatus = withCmsWorkflowStatus;
exports.getCmsWorkflowPublishedAt = getCmsWorkflowPublishedAt;
exports.stripCmsWorkflowMeta = stripCmsWorkflowMeta;
exports.CMS_WORKFLOW_META_KEY = "__orvenix";
exports.CMS_WORKFLOW_STATUSES = ["draft", "review", "published"];
function toRecordData(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
    return Object.assign({}, value);
}
function toWorkflowMeta(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
    return Object.assign({}, value);
}
function isCmsWorkflowStatus(value) {
    return typeof value === "string" && exports.CMS_WORKFLOW_STATUSES.includes(value);
}
function getCmsWorkflowStatus(data, publishedAt) {
    if (publishedAt)
        return "published";
    const source = toRecordData(data);
    const meta = toWorkflowMeta(source[exports.CMS_WORKFLOW_META_KEY]);
    return meta.workflowStatus === "review" ? "review" : "draft";
}
function withCmsWorkflowStatus(data, status) {
    const source = toRecordData(data);
    const meta = toWorkflowMeta(source[exports.CMS_WORKFLOW_META_KEY]);
    source[exports.CMS_WORKFLOW_META_KEY] = Object.assign(Object.assign({}, meta), { workflowStatus: status });
    return source;
}
function getCmsWorkflowPublishedAt(status, current) {
    if (status === "published") {
        if (current instanceof Date)
            return current;
        if (typeof current === "string" && current)
            return new Date(current);
        return new Date();
    }
    return null;
}
function stripCmsWorkflowMeta(data) {
    const source = toRecordData(data);
    delete source[exports.CMS_WORKFLOW_META_KEY];
    return source;
}
