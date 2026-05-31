"use server";

import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { createSite, deleteSiteForRole, type UserRole } from "@/lib/auth";
import { getWebsiteLimitMessage, requireCanCreateWebsite } from "@/lib/plan-guard";
import {
  assertUserCanRequestSiteEdit,
  createEditRequest,
  updateEditRequestStatusForRole,
  type EditRequestStatus,
} from "@/lib/editRequests";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login");
  return session.user as { id: string; email: string; name?: string; role: UserRole };
}

export async function createSiteAction(formData: FormData) {
  const user = await requireSession();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";

  if (!name) return { error: "El nombre es requerido." };

  try {
    await requireCanCreateWebsite(user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : getWebsiteLimitMessage({ isActive: false, plan: null }),
    };
  }

  try {
    const site = await createSite(name, description, user.id);
    revalidatePath("/dashboard");
    return { ok: true, id: site.id };
  } catch {
    return { error: "No se pudo crear el sitio." };
  }
}

export async function deleteSiteAction(id: string) {
  const user = await requireSession();
  await deleteSiteForRole(id, user.id, user.role);
  revalidatePath("/dashboard");
}

export type SiteEditRequestState = {
  ok?: boolean;
  error?: string;
  ticketId?: string;
};

export async function createSiteEditRequestAction(
  _prevState: SiteEditRequestState,
  formData: FormData
): Promise<SiteEditRequestState> {
  const user = await requireSession();
  const siteId = String(formData.get("siteId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const assets = String(formData.get("assets") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");

  if (message.length < 20) {
    return { error: "Describe los cambios con al menos 20 caracteres." };
  }

  try {
    const site = await assertUserCanRequestSiteEdit(siteId, user.id, user.role);
    const ticketId = await createEditRequest({
      type: "site_adjustments",
      siteId: site.id,
      siteName: site.name,
      userId: user.id,
      userEmail: user.email,
      message,
      assets,
      timeline,
      priority: priority === "high" ? "high" : priority === "low" ? "low" : "normal",
    });

    revalidatePath("/dashboard");
    return { ok: true, ticketId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la solicitud.",
    };
  }
}

export async function updateEditRequestStatusAction(ticketId: string, status: EditRequestStatus) {
  const user = await requireSession();
  await updateEditRequestStatusForRole({
    ticketId,
    status,
    userId: user.id,
    role: user.role,
  });
  revalidatePath("/dashboard");
}
