"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportNavMarkupModel = getExportNavMarkupModel;
exports.getExportPlaceholderMarkupModel = getExportPlaceholderMarkupModel;
const exportNodes_1 = require("./exportNodes");
const exportModels_1 = require("./exportModels");
function getExportNavMarkupModel(props, options) {
    const navModel = (0, exportNodes_1.resolveExportNavModel)(props, options);
    return {
        ariaLabel: navModel.ariaLabel,
        navClass: navModel.navClass,
        hasLinks: navModel.links.length > 0,
        links: navModel.links.map((link) => ({
            href: link.href,
            name: link.name,
            isActive: link.isActive,
        })),
    };
}
function getExportPlaceholderMarkupModel(node) {
    var _a, _b;
    const placeholder = (0, exportModels_1.getExportPlaceholderModel)(node);
    return {
        tag: (_b = (_a = placeholder.meta) === null || _a === void 0 ? void 0 : _a.tag) !== null && _b !== void 0 ? _b : "section",
        className: placeholder.className,
        label: placeholder.label,
        headingId: `${placeholder.slug}-heading`,
        meta: placeholder.meta ? {
            icon: placeholder.meta.icon,
            heading: placeholder.meta.heading,
            label: placeholder.meta.label,
            description: placeholder.meta.description,
        } : null,
    };
}
