import { randomBytes } from "crypto";
import { editorPrisma } from "@/lib/editor-db";
import { createSiteFromTree } from "@/lib/auth";
import { fileStoreApi } from "@/lib/file-store";
import { getEditorTreeForWeb, WEB_LABELS, type EditorWebId } from "@/lib/editorWebs";
import { getRealTemplate } from "@/lib/realTemplates";
import { isFileStorageMode } from "@/lib/storage-mode";
import { requireCanCreateWebsite } from "@/lib/plan-guard";

export type TemplateIntent = "edit" | "buy" | "rent";

export interface TemplateFlowUser {
  id: string;
  email: string;
}

const FLOW_CONFIG = {
  edit: {
    status: "editable_created",
    pricingModel: "self_service",
    siteSuffix: "Edición propia",
    descriptionPrefix: "self_service",
  },
  buy: {
    status: "pending_payment",
    pricingModel: "one_time_purchase",
    siteSuffix: "Compra única",
    descriptionPrefix: "purchase_license",
  },
  rent: {
    status: "pending_activation",
    pricingModel: "monthly_rental",
    siteSuffix: "Renta mensual",
    descriptionPrefix: "rental_subscription",
  },
} as const;

async function ensureTemplateIntentTable() {
  if (isFileStorageMode()) return;

  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS template_intents (
      id VARCHAR(64) NOT NULL,
      templateId VARCHAR(64) NOT NULL,
      templateName VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      userEmail VARCHAR(191) NOT NULL,
      intent VARCHAR(32) NOT NULL,
      status VARCHAR(64) NOT NULL,
      pricingModel VARCHAR(64) NOT NULL,
      amountCents INT NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'MXN',
      siteId VARCHAR(64) NULL,
      metadata JSON NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX template_intents_userId_idx (userId),
      INDEX template_intents_templateId_idx (templateId),
      INDEX template_intents_intent_idx (intent),
      INDEX template_intents_status_idx (status)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

function amountForIntent(templateId: EditorWebId, intent: TemplateIntent) {
  const template = getRealTemplate(templateId);
  if (!template || intent === "edit") return 0;
  return (intent === "buy" ? template.purchasePriceMxn : template.rentalPriceMxn) * 100;
}

export async function runIntelligentTemplateFlow({
  templateId,
  intent,
  user,
}: {
  templateId: EditorWebId;
  intent: TemplateIntent;
  user: TemplateFlowUser;
}) {
  const template = getRealTemplate(templateId);
  const config = FLOW_CONFIG[intent];
  await requireCanCreateWebsite(user.id);

  const site = await createSiteFromTree({
    name: `${WEB_LABELS[templateId]} - ${config.siteSuffix}`,
    description: `${config.descriptionPrefix}: template_intent=${intent}; plantilla=${template?.name ?? WEB_LABELS[templateId]}.`,
    userId: user.id,
    tree: getEditorTreeForWeb(templateId),
  });

  await ensureTemplateIntentTable();

  const intentId = `intent_${randomBytes(6).toString("hex")}`;
  const metadata = JSON.stringify({
    livePath: template?.livePath,
    category: template?.category,
    nextStep:
      intent === "edit"
        ? "open_editor"
        : intent === "buy"
          ? "create_checkout_or_invoice"
          : "activate_monthly_service",
  });

  if (isFileStorageMode()) {
    await fileStoreApi.createTemplateIntent({
      id: intentId,
      templateId,
      templateName: template?.name ?? WEB_LABELS[templateId],
      userId: user.id,
      userEmail: user.email,
      intent,
      status: config.status,
      pricingModel: config.pricingModel,
      amountCents: amountForIntent(templateId, intent),
      currency: "MXN",
      siteId: site.id,
      metadata,
    });
  } else {
    await editorPrisma.$executeRaw`
      INSERT INTO template_intents (
        id,
        templateId,
        templateName,
        userId,
        userEmail,
        intent,
        status,
        pricingModel,
        amountCents,
        currency,
        siteId,
        metadata
      ) VALUES (
        ${intentId},
        ${templateId},
        ${template?.name ?? WEB_LABELS[templateId]},
        ${user.id},
        ${user.email},
        ${intent},
        ${config.status},
        ${config.pricingModel},
        ${amountForIntent(templateId, intent)},
        ${"MXN"},
        ${site.id},
        ${metadata}
      )
    `;
  }

  const nextRoute = intent === "edit"
    ? `/editor/${site.id}`
    : `/checkout?intent=${intent}&siteId=${encodeURIComponent(site.id)}&templateId=${encodeURIComponent(templateId)}`;

  return { intentId, site, nextRoute };
}
