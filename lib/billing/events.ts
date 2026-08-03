export const BillingEvents = {
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SUBSCRIPTION_RESTORED: "subscription_restored",
  PLAN_CHANGED: "plan_changed",
  PLAN_SCHEDULED: "plan_scheduled",
  PLAN_APPLIED: "plan_applied",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  REFUND: "refund",
} as const;

export type BillingEvent =
  typeof BillingEvents[keyof typeof BillingEvents];
