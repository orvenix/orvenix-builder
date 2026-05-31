import type { SEOMetadata } from "../../../types/editor"
import { normalizeDocumentSeo } from "./document"

export interface ExportSeoModel {
  title: string
  description: string
  keywords: string
  ogImage: string
  canonicalUrl: string
}

export interface ExportHtmlSeoMetaModel {
  description: string
  keywords: string
  canonicalUrl: string
  openGraph: Array<{ property: string; content: string }>
  twitter: Array<{ name: string; content: string }>
}

export interface ExportJsxMetadataModel {
  title: string
  description?: string
  keywords?: string
  openGraph: {
    title: string
    description?: string
    images?: Array<{ url: string }>
    type: "website"
  }
  twitter: {
    card: "summary_large_image"
    title: string
    description?: string
    images?: string[]
  }
}

export function getExportSeoModel(siteName: string, seo?: SEOMetadata): ExportSeoModel {
  const normalized = normalizeDocumentSeo({
    title: seo?.title?.trim() || siteName,
    description: seo?.description,
    keywords: seo?.keywords,
    ogImage: seo?.ogImage,
  })

  return {
    ...normalized,
    canonicalUrl: typeof seo?.canonicalUrl === "string" ? seo.canonicalUrl.trim() : "",
  }
}

export function getExportHtmlSeoMetaModel(seo: ExportSeoModel): ExportHtmlSeoMetaModel {
  return {
    description: seo.description,
    keywords: seo.keywords,
    canonicalUrl: seo.canonicalUrl,
    openGraph: [
      { property: "og:title", content: seo.title },
      { property: "og:type", content: "website" },
      ...(seo.description ? [{ property: "og:description", content: seo.description }] : []),
      ...(seo.ogImage ? [{ property: "og:image", content: seo.ogImage }] : []),
    ],
    twitter: [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seo.title },
      ...(seo.description ? [{ name: "twitter:description", content: seo.description }] : []),
      ...(seo.ogImage ? [{ name: "twitter:image", content: seo.ogImage }] : []),
    ],
  }
}

export function getExportJsxMetadataModel(seo: ExportSeoModel): ExportJsxMetadataModel {
  return {
    title: seo.title,
    ...(seo.description ? { description: seo.description } : {}),
    ...(seo.keywords ? { keywords: seo.keywords } : {}),
    openGraph: {
      title: seo.title,
      ...(seo.description ? { description: seo.description } : {}),
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      ...(seo.description ? { description: seo.description } : {}),
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  }
}
