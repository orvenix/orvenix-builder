"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtmlExportNode = renderHtmlExportNode;
exports.renderJsxExportNode = renderJsxExportNode;
const exportMarkup_1 = require("./exportMarkup");
const exportModels_1 = require("./exportModels");
function renderHtmlExportNode(context, options, helpers) {
    var _a;
    const { node, props, indent, children } = context;
    const { escape, styleAttr } = helpers;
    switch (node.type) {
        case "section":
        case "genericWrapper": {
            const layout = (0, exportModels_1.getExportLayoutModel)(node);
            const maxWidth = layout.maxWidth ? ` data-max-width="${escape(layout.maxWidth)}"` : "";
            const style = styleAttr(node.props);
            return children
                ? `${indent}<${layout.tag}${style}${maxWidth}>\n${children}\n${indent}</${layout.tag}>`
                : `${indent}<${layout.tag}${style}${maxWidth}></${layout.tag}>`;
        }
        case "heading": {
            const heading = (0, exportModels_1.getExportHeadingModel)(node);
            const align = heading.alignClass ? ` class="${escape(heading.alignClass)}"` : "";
            return `${indent}<${heading.tag}${align}${styleAttr(node.props)}>${escape(heading.text)}</${heading.tag}>`;
        }
        case "text": {
            const text = (0, exportModels_1.getExportTextModel)(node);
            const align = text.alignClass ? ` class="${escape(text.alignClass)}"` : "";
            const html = text.content.split("\n").map((part) => escape(part)).join("<br />");
            return `${indent}<p${align}${styleAttr(node.props)}>${html}</p>`;
        }
        case "ctaButton": {
            const button = (0, exportModels_1.getExportButtonModel)(node, (_a = options === null || options === void 0 ? void 0 : options.siteId) !== null && _a !== void 0 ? _a : null);
            const href = ` href="${escape(button.href)}"`;
            const rel = button.isExternal ? ` rel="noopener noreferrer"` : "";
            const ext = button.isExternal ? ` target="_blank"` : "";
            return `${indent}<a${href}${ext}${rel}${styleAttr(node.props)} class="${button.className}">${escape(button.label)}</a>`;
        }
        case "siteNav": {
            const navModel = (0, exportMarkup_1.getExportNavMarkupModel)(props, options);
            if (!navModel.hasLinks) {
                return `${indent}<nav class="${navModel.navClass}" aria-label="${escape(navModel.ariaLabel)}"></nav>`;
            }
            return [
                `${indent}<nav class="${navModel.navClass}" aria-label="${escape(navModel.ariaLabel)}">`,
                `${indent}  <ul>`,
                ...navModel.links.map((link) => `${indent}    <li><a href="${escape(link.href)}"${link.isActive ? ` aria-current="page"` : ""}>${escape(link.name)}</a></li>`),
                `${indent}  </ul>`,
                `${indent}</nav>`,
            ].join("\n");
        }
        case "image": {
            const image = (0, exportModels_1.getExportImageModel)(node);
            const src = image.src ? ` src="${escape(image.src)}"` : "";
            const alt = ` alt="${escape(image.alt)}"`;
            const width = image.width !== null ? ` width="${image.width}"` : "";
            const height = image.height !== null ? ` height="${image.height}"` : "";
            const fit = image.objectFitCover ? ` style="object-fit:cover;width:100%;height:100%"` : "";
            if (image.caption) {
                return [
                    `${indent}<figure${styleAttr(node.props)}>`,
                    `${indent}  <img${src}${alt}${width}${height}${fit} loading="lazy" />`,
                    `${indent}  <figcaption>${escape(image.caption)}</figcaption>`,
                    `${indent}</figure>`,
                ].join("\n");
            }
            return `${indent}<img${src}${alt}${width}${height}${fit} loading="lazy" />`;
        }
        default: {
            const placeholder = (0, exportMarkup_1.getExportPlaceholderMarkupModel)(node);
            const style = styleAttr(node.props);
            if (placeholder.meta) {
                return [
                    `${indent}<${placeholder.tag} class="${placeholder.className}"${style} aria-labelledby="${placeholder.headingId}">`,
                    `${indent}  <h2 id="${placeholder.headingId}" class="sr-only">${escape(placeholder.meta.heading)}</h2>`,
                    `${indent}  <div class="orv-block__inner">`,
                    `${indent}    <span class="orv-block__icon" aria-hidden="true">${placeholder.meta.icon}</span>`,
                    `${indent}    <span class="orv-block__label">${escape(placeholder.meta.label)}</span>`,
                    `${indent}    <span class="orv-block__description">${escape(placeholder.meta.description)}</span>`,
                    `${indent}  </div>`,
                    children || "",
                    `${indent}</${placeholder.tag}>`,
                ].filter(Boolean).join("\n");
            }
            if (children) {
                return `${indent}<section class="${placeholder.className}"${style} aria-label="${escape(placeholder.label)}">\n${children}\n${indent}</section>`;
            }
            return `${indent}<section class="${placeholder.className}"${style} aria-label="${escape(placeholder.label)}"></section>`;
        }
    }
}
function renderJsxExportNode(context, options, helpers) {
    var _a;
    const { node, props, indent, children } = context;
    const { escape, styleExpr } = helpers;
    switch (node.type) {
        case "section":
        case "genericWrapper": {
            const layout = (0, exportModels_1.getExportLayoutModel)(node);
            const style = styleExpr(node.props);
            return children
                ? `${indent}<${layout.tag}${style}>\n${children}\n${indent}</${layout.tag}>`
                : `${indent}<${layout.tag}${style} />`;
        }
        case "heading": {
            const heading = (0, exportModels_1.getExportHeadingModel)(node);
            const className = heading.alignClass ? ` className="${heading.alignClass}"` : "";
            return `${indent}<${heading.tag}${className}${styleExpr(node.props)}>${escape(heading.text)}</${heading.tag}>`;
        }
        case "text": {
            const text = (0, exportModels_1.getExportTextModel)(node);
            const className = text.alignClass ? ` className="${text.alignClass}"` : "";
            return `${indent}<p${className}${styleExpr(node.props)}>${escape(text.content)}</p>`;
        }
        case "ctaButton": {
            const button = (0, exportModels_1.getExportButtonModel)(node, (_a = options === null || options === void 0 ? void 0 : options.siteId) !== null && _a !== void 0 ? _a : null);
            const href = ` href="${escape(button.href)}"`;
            return `${indent}<a${href}${styleExpr(node.props)} className="${button.className}">${escape(button.label)}</a>`;
        }
        case "siteNav": {
            const navModel = (0, exportMarkup_1.getExportNavMarkupModel)(props, options);
            if (!navModel.hasLinks) {
                return `${indent}<nav className="${navModel.navClass}" aria-label="${escape(navModel.ariaLabel)}" />`;
            }
            return [
                `${indent}<nav className="${navModel.navClass}" aria-label="${escape(navModel.ariaLabel)}">`,
                `${indent}  <ul>`,
                ...navModel.links.map((link) => `${indent}    <li><a href="${escape(link.href)}"${link.isActive ? ` aria-current="page"` : ""}>${escape(link.name)}</a></li>`),
                `${indent}  </ul>`,
                `${indent}</nav>`,
            ].join("\n");
        }
        case "image": {
            const image = (0, exportModels_1.getExportImageModel)(node);
            const src = image.src ? ` src="${escape(image.src)}"` : "";
            const alt = ` alt="${escape(image.alt)}"`;
            const className = image.objectFitCover ? ` className="w-full h-full object-cover"` : "";
            return `${indent}<img${src}${alt}${className} loading="lazy" />`;
        }
        default: {
            const placeholder = (0, exportMarkup_1.getExportPlaceholderMarkupModel)(node);
            const dataBlock = ` data-block="${escape(node.type)}"`;
            const style = styleExpr(node.props);
            return children
                ? `${indent}<section${dataBlock}${style}>\n${indent}  <span className="sr-only">${escape(placeholder.label)}</span>\n${children}\n${indent}</section>`
                : `${indent}<section${dataBlock}${style} aria-label="${escape(placeholder.label)}" />`;
        }
    }
}
