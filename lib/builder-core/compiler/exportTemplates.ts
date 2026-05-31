import type { ExportJsxMetadataModel } from "./exportDocument"

export interface BuildHtmlDocumentOptions {
  title: string
  description?: string
  keywords?: string
  canonicalLine?: string
  openGraphLines?: string
  twitterLines?: string
  stylesHref: string
  bodyContent: string
}

export interface BuildNextPageOptions {
  metadata: ExportJsxMetadataModel
  bodyContent: string
}

export function buildHtmlDocument(options: BuildHtmlDocumentOptions) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  ${options.description ? `<meta name="description" content="${options.description}" />` : ""}
  ${options.keywords ? `<meta name="keywords" content="${options.keywords}" />` : ""}
${options.canonicalLine ?? ""}
${options.openGraphLines ?? ""}
${options.twitterLines ?? ""}
  <link rel="stylesheet" href="${options.stylesHref}" />
</head>
<body>
<main>

${options.bodyContent}

</main>
</body>
</html>`
}

export function buildNextPageTsx(options: BuildNextPageOptions) {
  const { metadata, bodyContent } = options

  return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${metadata.title}",
  ${metadata.description ? `description: "${metadata.description}",` : ""}
  ${metadata.keywords ? `keywords: "${metadata.keywords}",` : ""}
  openGraph: {
    title: "${metadata.openGraph.title}",
    ${metadata.openGraph.description ? `description: "${metadata.openGraph.description}",` : ""}
    ${metadata.openGraph.images?.[0]?.url ? `images: [{ url: "${metadata.openGraph.images[0].url}" }],` : ""}
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "${metadata.twitter.title}",
    ${metadata.twitter.description ? `description: "${metadata.twitter.description}",` : ""}
    ${metadata.twitter.images?.[0] ? `images: ["${metadata.twitter.images[0]}"],` : ""}
  },
};

export default function Page() {
  return (
    <main>

${bodyContent}

    </main>
  );
}
`
}

export function buildNextLayoutTsx(siteName: string) {
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
`
}
