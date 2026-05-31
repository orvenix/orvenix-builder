import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"
import { fileStoreApi } from "@/lib/file-store"
import { REAL_TEMPLATES } from "@/lib/realTemplates"

export interface ReceiptData {
  folio: string
  createdAt: Date
  site: {
    id: string
    name: string
    description: string
    published: boolean
  }
  client: {
    name: string
    email: string
  }
  order: {
    action: "buy" | "rent"
    templateName: string | null
    templateCategory: string | null
    priceMxn: number | null
    status: "pending" | "paid" | "unknown"
  }
}

function extractAction(description: string): "buy" | "rent" {
  if (description.includes("checkout:rent") || description.includes(":rent:")) return "rent"
  return "buy"
}

function buildFolio(siteId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const short = siteId.replace("site_", "").slice(0, 6).toUpperCase()
  return `ORV-${year}${month}-${short}`
}

function inferPricing(siteName: string, description: string, action: "buy" | "rent") {
  const tmpl = REAL_TEMPLATES.find(t =>
    siteName.toLowerCase().includes(t.name.toLowerCase()) ||
    description.toLowerCase().includes(t.id.toLowerCase()) ||
    siteName.toLowerCase().includes(t.id.toLowerCase())
  )
  if (!tmpl) return { priceMxn: null, templateName: null, templateCategory: null }
  return {
    priceMxn: action === "buy" ? tmpl.purchasePriceMxn : tmpl.rentalPriceMxn,
    templateName: tmpl.name,
    templateCategory: tmpl.category,
  }
}

export async function getReceiptData(siteId: string): Promise<ReceiptData | null> {
  if (isFileStorageMode()) {
    const store = await fileStoreApi.readStore()
    const rawSite = store.sites.find(s => s.id === siteId)
    if (!rawSite) return null

    const user = rawSite.userId
      ? store.users.find(u => u.id === rawSite.userId)
      : null

    // Buscar intent para este sitio
    const intent = store.templateIntents.find(i => i.siteId === siteId)

    const action = extractAction(rawSite.description)
    const pricing = inferPricing(rawSite.name, rawSite.description, action)
    const priceMxn = intent?.amountCents && intent.amountCents > 0
      ? intent.amountCents / 100
      : pricing.priceMxn

    return {
      folio: buildFolio(siteId, new Date(rawSite.createdAt)),
      createdAt: new Date(rawSite.createdAt),
      site: {
        id: rawSite.id,
        name: rawSite.name,
        description: rawSite.description,
        published: rawSite.published,
      },
      client: {
        name: user?.name ?? user?.email?.split("@")[0] ?? "Cliente",
        email: user?.email ?? "",
      },
      order: {
        action,
        templateName: intent?.templateName ?? pricing.templateName,
        templateCategory: pricing.templateCategory,
        priceMxn,
        status: intent?.status === "paid" ? "paid" : "pending",
      },
    }
  }

  // Modo Prisma
  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: {
      id: true, name: true, description: true, published: true, createdAt: true,
      user: { select: { email: true, name: true } },
    },
  })
  if (!site) return null

  const action = extractAction(site.description)
  const pricing = inferPricing(site.name, site.description, action)

  return {
    folio: buildFolio(siteId, site.createdAt),
    createdAt: site.createdAt,
    site: { id: site.id, name: site.name, description: site.description, published: site.published },
    client: {
      name: site.user?.name ?? site.user?.email?.split("@")[0] ?? "Cliente",
      email: site.user?.email ?? "",
    },
    order: {
      action,
      templateName: pricing.templateName,
      templateCategory: pricing.templateCategory,
      priceMxn: pricing.priceMxn,
      status: "pending",
    },
  }
}
