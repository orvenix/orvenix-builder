import { randomUUID } from "crypto";
import { editorPrisma } from "@/lib/editor-db";

export interface SubscriptionHistoryInput {
  subscriptionId: string;
  userId: string;

  oldPlanId?: string | null;
  newPlanId?: string | null;

  oldInterval?: string | null;
  newInterval?: string | null;

  oldStatus?: string | null;
  newStatus?: string | null;

  provider?: string;
  reason: string;

  metadata?: unknown;
}

export async function createSubscriptionHistory(
  input: SubscriptionHistoryInput
) {
  return editorPrisma.subscriptionHistory.create({
    data: {
      id: randomUUID(),

      subscriptionId: input.subscriptionId,
      userId: input.userId,

      oldPlanId: input.oldPlanId ?? null,
      newPlanId: input.newPlanId ?? null,

      oldInterval: input.oldInterval ?? null,
      newInterval: input.newInterval ?? null,

      oldStatus: input.oldStatus ?? null,
      newStatus: input.newStatus ?? null,

      provider: input.provider ?? "stripe",
      reason: input.reason,

      metadata:
        input.metadata === undefined
          ? undefined
          : (JSON.parse(JSON.stringify(input.metadata)) as never),
    },
  });
}
