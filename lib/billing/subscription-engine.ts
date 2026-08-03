import { editorPrisma } from "@/lib/editor-db";
import { BillingEvents } from "@/lib/billing/events";
import { createSubscriptionHistory } from "@/lib/billing/subscription-history";

type ApplyPaidPlanInput = {
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;

  planId: string;
  interval: "month" | "year";

  currentPeriodEnd?: Date | null;

  invoiceId?: string | null;
  stripePriceId?: string | null;
  amountPaid?: number | null;
  currency?: string | null;
};

export async function applyPaidPlan(input: ApplyPaidPlanInput) {
  const subscription = await editorPrisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    select: {
      id: true,
      userId: true,
      planId: true,
      interval: true,
      status: true,
    },
  });

  if (!subscription) {
    return {
      ok: false as const,
      code: "SUBSCRIPTION_NOT_FOUND" as const,
    };
  }

  const planChanged =
    subscription.planId !== input.planId ||
    subscription.interval !== input.interval;

  await editorPrisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      provider: "stripe",
      status: "active",

      planId: input.planId,
      interval: input.interval,

      currentPeriodEnd: input.currentPeriodEnd ?? null,
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      canceledAt: null,

      pendingPlanId: null,
      pendingInterval: null,
      pendingStartsAt: null,
      pendingStripePriceId: null,
    },
  });

  await createSubscriptionHistory({
    subscriptionId: subscription.id,
    userId: subscription.userId,

    oldPlanId: subscription.planId,
    newPlanId: input.planId,

    oldInterval: subscription.interval,
    newInterval: input.interval,

    oldStatus: subscription.status,
    newStatus: "active",

    provider: "stripe",
    reason: planChanged
      ? BillingEvents.PLAN_APPLIED
      : BillingEvents.PAYMENT_SUCCEEDED,

    metadata: {
      invoiceId: input.invoiceId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripePriceId: input.stripePriceId ?? null,
      amountPaid: input.amountPaid ?? null,
      currency: input.currency ?? null,
    },
  });

  return {
    ok: true as const,
    subscriptionId: subscription.id,
    planChanged,
  };
}

type SchedulePlanChangeInput = {
  stripeSubscriptionId: string;

  planId: string;
  interval: "month" | "year";

  startsAt: Date | null;
  stripePriceId: string;

  scheduleId?: string | null;
};

export async function schedulePlanChange(input: SchedulePlanChangeInput) {
  const subscription = await editorPrisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    select: {
      id: true,
      userId: true,
      planId: true,
      interval: true,
      status: true,
      pendingPlanId: true,
      pendingInterval: true,
    },
  });

  if (!subscription) {
    return {
      ok: false as const,
      code: "SUBSCRIPTION_NOT_FOUND" as const,
    };
  }

  await editorPrisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      pendingPlanId: input.planId,
      pendingInterval: input.interval,
      pendingStartsAt: input.startsAt,
      pendingStripePriceId: input.stripePriceId,
    },
  });

  const pendingChanged =
    subscription.pendingPlanId !== input.planId ||
    subscription.pendingInterval !== input.interval;

  if (pendingChanged) {
    await createSubscriptionHistory({
      subscriptionId: subscription.id,
      userId: subscription.userId,

      oldPlanId: subscription.planId,
      newPlanId: input.planId,

      oldInterval: subscription.interval,
      newInterval: input.interval,

      oldStatus: subscription.status,
      newStatus: subscription.status,

      provider: "stripe",
      reason: BillingEvents.PLAN_SCHEDULED,

      metadata: {
        scheduleId: input.scheduleId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripePriceId: input.stripePriceId,
        startsAt: input.startsAt?.toISOString() ?? null,
      },
    });
  }

  return {
    ok: true as const,
    subscriptionId: subscription.id,
    changed: pendingChanged,
  };
}

type SyncStripeSubscriptionInput = {
  stripeSubscriptionId: string
  stripeCustomerId?: string | null
  userId?: string | null

  planId?: string | null
  interval: "month" | "year"
  status: string

  currentPeriodEnd?: Date | null
  canceledAt?: Date | null
}

export async function syncStripeSubscription(
  input: SyncStripeSubscriptionInput
) {
  const current = await editorPrisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    select: {
      id: true,
      userId: true,
      planId: true,
      interval: true,
      status: true,
    },
  })

  if (!current) {
    if (!input.userId) {
      return {
        ok: false as const,
        code: "SUBSCRIPTION_NOT_FOUND" as const,
      }
    }

    const created = await editorPrisma.subscription.create({
      data: {
        userId: input.userId,
        provider: "stripe",
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId ?? null,

        planId: input.planId ?? "starter",
        interval: input.interval,
        status: input.status,

        currentPeriodEnd: input.currentPeriodEnd ?? null,
        canceledAt: input.canceledAt ?? null,
      },
    })

    await createSubscriptionHistory({
      subscriptionId: created.id,
      userId: created.userId,

      oldPlanId: null,
      newPlanId: created.planId,

      oldInterval: null,
      newInterval: created.interval,

      oldStatus: null,
      newStatus: created.status,

      provider: "stripe",
      reason: BillingEvents.SUBSCRIPTION_CREATED,

      metadata: {
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId ?? null,
      },
    })

    return {
      ok: true as const,
      subscriptionId: created.id,
      created: true,
    }
  }

  const planChanged =
    Boolean(input.planId) &&
    (
      current.planId !== input.planId ||
      current.interval !== input.interval
    )

  const statusChanged = current.status !== input.status

  await editorPrisma.subscription.update({
    where: {
      id: current.id,
    },
    data: {
      provider: "stripe",
      stripeCustomerId: input.stripeCustomerId ?? undefined,

      ...(input.planId ? { planId: input.planId } : {}),
      interval: input.interval,
      status: input.status,

      currentPeriodEnd: input.currentPeriodEnd ?? null,
      canceledAt: input.canceledAt ?? null,
    },
  })

  if (planChanged || statusChanged) {
    let reason: string = BillingEvents.SUBSCRIPTION_UPDATED

    if (
      input.status === "cancelled" ||
      input.status === "canceled"
    ) {
      reason = BillingEvents.SUBSCRIPTION_CANCELLED
    } else if (
      (current.status === "cancelled" || current.status === "canceled") &&
      input.status === "active"
    ) {
      reason = BillingEvents.SUBSCRIPTION_RESTORED
    } else if (planChanged) {
      reason = BillingEvents.PLAN_CHANGED
    }

    await createSubscriptionHistory({
      subscriptionId: current.id,
      userId: current.userId,

      oldPlanId: current.planId,
      newPlanId: input.planId ?? current.planId,

      oldInterval: current.interval,
      newInterval: input.interval,

      oldStatus: current.status,
      newStatus: input.status,

      provider: "stripe",
      reason,

      metadata: {
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId ?? null,
      },
    })
  }

  return {
    ok: true as const,
    subscriptionId: current.id,
    created: false,
    planChanged,
    statusChanged,
  }
}

type MarkPaymentFailedInput = {
  stripeSubscriptionId: string
  stripeCustomerId?: string | null
  invoiceId?: string | null
  amountDue?: number | null
  currency?: string | null
  nextPaymentAttempt?: Date | null
}

export async function markPaymentFailed(
  input: MarkPaymentFailedInput
) {
  const subscription = await editorPrisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    select: {
      id: true,
      userId: true,
      planId: true,
      interval: true,
      status: true,
    },
  })

  if (!subscription) {
    return {
      ok: false as const,
      code: "SUBSCRIPTION_NOT_FOUND" as const,
    }
  }

  await editorPrisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: "past_due",
      stripeCustomerId: input.stripeCustomerId ?? undefined,
    },
  })

  if (subscription.status !== "past_due") {
    await createSubscriptionHistory({
      subscriptionId: subscription.id,
      userId: subscription.userId,

      oldPlanId: subscription.planId,
      newPlanId: subscription.planId,

      oldInterval: subscription.interval,
      newInterval: subscription.interval,

      oldStatus: subscription.status,
      newStatus: "past_due",

      provider: "stripe",
      reason: BillingEvents.PAYMENT_FAILED,

      metadata: {
        invoiceId: input.invoiceId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId ?? null,
        amountDue: input.amountDue ?? null,
        currency: input.currency ?? null,
        nextPaymentAttempt:
          input.nextPaymentAttempt?.toISOString() ?? null,
      },
    })
  }

  return {
    ok: true as const,
    subscriptionId: subscription.id,
  }
}
