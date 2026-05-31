import { randomBytes } from "crypto";
import { editorPrisma } from "@/lib/editor-db";
import { canManageSite, type UserRole } from "@/lib/auth";
import { fileStoreApi } from "@/lib/file-store";
import { isFileStorageMode } from "@/lib/storage-mode";
import { sendDifmCreatedEmail, sendDifmUpdatedEmail } from "@/lib/email";
import { serverError } from "@/lib/server-log";

export type EditRequestStatus = "open" | "in_progress" | "done" | "cancelled";
export type EditRequestPriority = "low" | "normal" | "high";

export interface EditRequest {
  id: string;
  type: string;
  templateId: string | null;
  templateName: string | null;
  siteId: string | null;
  siteName: string | null;
  userId: string;
  userEmail: string;
  workMode: string;
  assignedTo: string;
  status: EditRequestStatus;
  priority: EditRequestPriority;
  message: string;
  assets: string | null;
  timeline: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function ensureSupportTicketsTable() {
  if (isFileStorageMode()) return;

  await editorPrisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(64) NOT NULL,
      type VARCHAR(64) NOT NULL DEFAULT 'site_adjustments',
      templateId VARCHAR(64) NULL,
      templateName VARCHAR(191) NULL,
      siteId VARCHAR(64) NULL,
      siteName VARCHAR(191) NULL,
      userId VARCHAR(191) NOT NULL,
      userEmail VARCHAR(191) NOT NULL,
      workMode VARCHAR(64) NOT NULL DEFAULT 'provider_manual_edit',
      assignedTo VARCHAR(191) NOT NULL DEFAULT 'provider_team',
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      priority VARCHAR(32) NOT NULL DEFAULT 'normal',
      message TEXT NOT NULL,
      assets TEXT NULL,
      timeline VARCHAR(191) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX support_tickets_userId_idx (userId),
      INDEX support_tickets_siteId_idx (siteId),
      INDEX support_tickets_templateId_idx (templateId),
      INDEX support_tickets_status_idx (status),
      INDEX support_tickets_createdAt_idx (createdAt)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

export async function createEditRequest({
  type = "site_adjustments",
  templateId = null,
  templateName = null,
  siteId = null,
  siteName = null,
  userId,
  userEmail,
  message,
  assets = null,
  timeline = null,
  priority = "normal",
}: {
  type?: string;
  templateId?: string | null;
  templateName?: string | null;
  siteId?: string | null;
  siteName?: string | null;
  userId: string;
  userEmail: string;
  message: string;
  assets?: string | null;
  timeline?: string | null;
  priority?: EditRequestPriority;
}) {
  if (isFileStorageMode()) {
    const id = `ticket_${randomBytes(6).toString("hex")}`;
    await fileStoreApi.createTicket({
      id,
      type,
      templateId,
      templateName,
      siteId,
      siteName,
      userId,
      userEmail,
      workMode: "provider_manual_edit",
      assignedTo: "provider_team",
      status: "open",
      priority,
      message,
      assets,
      timeline,
    });

    sendDifmCreatedEmail({
      userName: userEmail.split("@")[0],
      userEmail,
      ticketId: id,
      siteName: siteName ?? templateName ?? "Tu sitio",
      message,
      timeline: timeline ?? null,
    }).catch((err) => serverError("[difm] Email failed", err));

    return id;
  }

  await ensureSupportTicketsTable();

  const id = `ticket_${randomBytes(6).toString("hex")}`;

  // Notificar por email (fire-and-forget)
  sendDifmCreatedEmail({
    userName: userEmail.split("@")[0],
    userEmail,
    ticketId: id,
    siteName: siteName ?? templateName ?? "Tu sitio",
    message,
    timeline: timeline ?? null,
  }).catch((err) => serverError("[difm] Email failed", err));

  await editorPrisma.$executeRaw`
    INSERT INTO support_tickets (
      id,
      type,
      templateId,
      templateName,
      siteId,
      siteName,
      userId,
      userEmail,
      workMode,
      assignedTo,
      status,
      priority,
      message,
      assets,
      timeline
    ) VALUES (
      ${id},
      ${type},
      ${templateId},
      ${templateName},
      ${siteId},
      ${siteName},
      ${userId},
      ${userEmail},
      ${"provider_manual_edit"},
      ${"provider_team"},
      ${"open"},
      ${priority},
      ${message},
      ${assets},
      ${timeline}
    )
  `;

  return id;
}

export async function getEditRequestsForRole(userId: string, role: UserRole) {
  if (isFileStorageMode()) {
    const tickets = await fileStoreApi.listTickets();
    const visible = role === "ADMIN" ? tickets : tickets.filter((ticket) => ticket.userId === userId);
    return visible
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 40) as EditRequest[];
  }

  await ensureSupportTicketsTable();

  if (role === "ADMIN") {
    return editorPrisma.$queryRaw<EditRequest[]>`
      SELECT *
      FROM support_tickets
      ORDER BY createdAt DESC
      LIMIT 40
    `;
  }

  return editorPrisma.$queryRaw<EditRequest[]>`
    SELECT *
    FROM support_tickets
    WHERE userId = ${userId}
    ORDER BY createdAt DESC
    LIMIT 40
  `;
}

export async function getEditRequestById(ticketId: string): Promise<EditRequest | null> {
  if (isFileStorageMode()) {
    const tickets = await fileStoreApi.listTickets();
    return (tickets.find(t => t.id === ticketId) as EditRequest | undefined) ?? null;
  }
  await ensureSupportTicketsTable();
  const rows = await editorPrisma.$queryRaw<EditRequest[]>`
    SELECT * FROM support_tickets WHERE id = ${ticketId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function updateEditRequestStatusForRole({
  ticketId,
  status,
  userId,
  role,
  notifyEmail,
}: {
  ticketId: string;
  status: EditRequestStatus;
  userId: string;
  role: UserRole;
  notifyEmail?: { userEmail: string; userName: string; siteName: string };
}) {
  let result;

  if (isFileStorageMode()) {
    result = role === "ADMIN"
      ? await fileStoreApi.updateTicketStatus(ticketId, status)
      : await fileStoreApi.updateTicketStatus(ticketId, status, userId);
  } else {
    await ensureSupportTicketsTable();

    if (role === "ADMIN") {
      result = await editorPrisma.$executeRaw`
        UPDATE support_tickets
        SET status = ${status}
        WHERE id = ${ticketId}
      `;
    } else {
      result = await editorPrisma.$executeRaw`
        UPDATE support_tickets
        SET status = ${status}
        WHERE id = ${ticketId}
          AND userId = ${userId}
          AND status IN ('open', 'in_progress')
      `;
    }
  }

  if (notifyEmail && status !== "open") {
    sendDifmUpdatedEmail({
      userName: notifyEmail.userName,
      userEmail: notifyEmail.userEmail,
      ticketId,
      siteName: notifyEmail.siteName,
      newStatus: status,
    }).catch((err) => serverError("[difm] Status email failed", err));
  }

  return result;
}

export async function assertUserCanRequestSiteEdit(siteId: string, userId: string, role: UserRole) {
  const allowed = await canManageSite(siteId, userId, role);
  if (!allowed) throw new Error("No autorizado para solicitar ajustes en este sitio.");

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, name: true },
  });

  if (!site) throw new Error("Sitio no encontrado.");
  return site;
}
