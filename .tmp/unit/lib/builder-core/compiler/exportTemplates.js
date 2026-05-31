"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHtmlDocument = buildHtmlDocument;
exports.buildNextPageTsx = buildNextPageTsx;
exports.buildNextLayoutTsx = buildNextLayoutTsx;
function buildHtmlDocument(options) {
    var _a, _b, _c;
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  ${options.description ? `<meta name="description" content="${options.description}" />` : ""}
  ${options.keywords ? `<meta name="keywords" content="${options.keywords}" />` : ""}
${(_a = options.canonicalLine) !== null && _a !== void 0 ? _a : ""}
${(_b = options.openGraphLines) !== null && _b !== void 0 ? _b : ""}
${(_c = options.twitterLines) !== null && _c !== void 0 ? _c : ""}
  <link rel="stylesheet" href="${options.stylesHref}" />
</head>
<body>
<main>

${options.bodyContent}

</main>
</body>
</html>`;
}
function buildNextPageTsx(options) {
    var _a, _b, _c;
    const { metadata, bodyContent } = options;
    return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${metadata.title}",
  ${metadata.description ? `description: "${metadata.description}",` : ""}
  ${metadata.keywords ? `keywords: "${metadata.keywords}",` : ""}
  openGraph: {
    title: "${metadata.openGraph.title}",
    ${metadata.openGraph.description ? `description: "${metadata.openGraph.description}",` : ""}
    ${((_b = (_a = metadata.openGraph.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) ? `images: [{ url: "${metadata.openGraph.images[0].url}" }],` : ""}
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "${metadata.twitter.title}",
    ${metadata.twitter.description ? `description: "${metadata.twitter.description}",` : ""}
    ${((_c = metadata.twitter.images) === null || _c === void 0 ? void 0 : _c[0]) ? `images: ["${metadata.twitter.images[0]}"],` : ""}
  },
};

export default function Page() {
  return (
    <main>

${bodyContent}

    </main>
  );
}
`;
}
function buildNextLayoutTsx(siteName) {
    return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${siteName}",
  description: "Sitio generado con Orvenix Builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
`;
}
