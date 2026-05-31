"use server";

import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSiteFromTree } from "@/lib/auth";
import { createEditRequest } from "@/lib/editRequests";
import { getEditorTreeForWeb, isEditorWebId, WEB_LABELS, type EditorWebId } from "@/lib/editorWebs";
import { getRealTemplate } from "@/lib/realTemplates";
import { runIntelligentTemplateFlow, type TemplateIntent } from "@/lib/intelligentTemplates";
import { requireCanCreateWebsite } from "@/lib/plan-guard";

export type ProfessionalEditState = {
  ok?: boolean;
  error?: string;
  ticketId?: string;
};

async function requireSession() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; email: string; name?: string | null };
}

async function createTemplateCopy(templateId: string) {
  const user = await requireSession();
  if (!isEditorWebId(templateId)) {
    throw new Error("Plantilla no encontrada.");
  }

  try {
    await requireCanCreateWebsite(user.id);
  } catch {
    redirect(`/precios?upgrade=websites&callbackUrl=${encodeURIComponent("/webs")}`);
  }

  const id = templateId as EditorWebId;
  const template = getRealTemplate(id);
  const site = await createSiteFromTree({
    name: `${WEB_LABELS[id]} - Edición propia`,
    description: template
      ? `self_service: copia editable creada desde la plantilla real ${template.name}.`
      : "self_service: copia editable creada desde plantilla real.",
    userId: user.id,
    tree: getEditorTreeForWeb(id),
  });

  revalidatePath("/dashboard");
  return site;
}

export async function assignTemplateAction(templateId: string) {
  await createTemplateCopy(templateId);
  redirect("/dashboard");
}

export async function editTemplateAction(templateId: string) {
  const site = await createTemplateCopy(templateId);
  redirect(`/editor/${site.id}`);
}

export async function selfEditTemplateAction(templateId: string) {
  await intelligentTemplateAction(templateId, "edit");
}

export async function buyTemplateAction(templateId: string) {
  await intelligentTemplateAction(templateId, "buy");
}

export async function rentTemplateAction(templateId: string) {
  await intelligentTemplateAction(templateId, "rent");
}

export async function intelligentTemplateAction(templateId: string, intent: TemplateIntent) {
  const user = await requireSession();
  if (!isEditorWebId(templateId)) {
    throw new Error("Plantilla no encontrada.");
  }

  try {
    await requireCanCreateWebsite(user.id);
  } catch {
    redirect(`/precios?upgrade=websites&callbackUrl=${encodeURIComponent("/webs")}`);
  }

  const result = await runIntelligentTemplateFlow({
    templateId: templateId as EditorWebId,
    intent,
    user,
  });

  revalidatePath("/dashboard");
  redirect(result.nextRoute);
}

export async function requestProfessionalEditAction(
  _prevState: ProfessionalEditState,
  formData: FormData
): Promise<ProfessionalEditState> {
  const user = await requireSession();
  const templateId = String(formData.get("templateId") ?? "");
  const brief = String(formData.get("brief") ?? "").trim();
  const assets = String(formData.get("assets") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();

  if (!isEditorWebId(templateId)) {
    return { error: "Plantilla no encontrada." };
  }

  if (brief.length < 20) {
    return { error: "Describe los cambios con al menos 20 caracteres." };
  }

  const template = getRealTemplate(templateId);
  const ticketId = await createEditRequest({
    type: "template_adjustments",
    templateId,
    templateName: template?.name ?? WEB_LABELS[templateId],
    userId: user.id,
    userEmail: user.email,
    message: brief,
    assets,
    timeline,
  });

  revalidatePath("/dashboard");
  return { ok: true, ticketId };
}
