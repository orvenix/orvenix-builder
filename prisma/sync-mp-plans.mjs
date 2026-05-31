import { createPrisma } from "./_client.mjs";
import { MercadoPagoConfig, PreApprovalPlan } from "mercadopago";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

const prisma = createPrisma();

function getMpAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  return token && !token.includes("placeholder") ? token : "";
}

function isMpConfigured() {
  return getMpAccessToken().length > 20;
}

function getAppUrl() {
  const raw =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}

async function createMpPlan(params) {
  const client = new MercadoPagoConfig({ accessToken: getMpAccessToken() });
  const plan = new PreApprovalPlan(client);
  const result = await plan.create({
    body: {
      reason: `Orvenix - ${params.planName}`,
      auto_recurring: {
        frequency: params.intervalFrequency,
        frequency_type: params.intervalUnit,
        transaction_amount: params.priceMxn,
        currency_id: "MXN",
      },
      payment_methods_allowed: {
        payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
      },
      back_url: `${getAppUrl()}/dashboard`,
    },
  });

  return {
    mpPlanId: result.id,
  };
}

function getIntervals(plan) {
  return [
    {
      label: "month",
      field: "mpPlanIdMonth",
      priceMxn: plan.priceMonthMxn,
      intervalUnit: "months",
      intervalFrequency: 1,
    },
    {
      label: "year",
      field: "mpPlanIdYear",
      priceMxn: plan.priceYearMxn,
      intervalUnit: "months",
      intervalFrequency: 12,
    },
  ];
}

try {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthMxn: "asc" },
  });

  if (!plans.length) {
    console.log("[sync-mp-plans] No hay planes activos. Ejecuta primero npm run seed.");
    process.exit(0);
  }

  if (!isMpConfigured()) {
    console.log("[sync-mp-plans] MP_ACCESS_TOKEN no esta configurado.");
    console.log("[sync-mp-plans] Ejecuta con --dry-run para revisar que se crearia.");
  }

  for (const plan of plans) {
    for (const interval of getIntervals(plan)) {
      const existingId = plan[interval.field];
      const shouldCreate = force || !existingId;
      const summary = `${plan.id}:${interval.label} -> ${existingId ?? "sin_id"}`;

      if (!shouldCreate) {
        console.log(`[sync-mp-plans] OK ${summary}`);
        continue;
      }

      if (dryRun || !isMpConfigured()) {
        console.log(
          `[sync-mp-plans] DRY ${plan.id}:${interval.label} ${interval.priceMxn} MXN (${interval.intervalFrequency} ${interval.intervalUnit})`
        );
        continue;
      }

      try {
        const result = await createMpPlan({
          planName: `${plan.name} ${interval.label === "year" ? "anual" : "mensual"}`,
          priceMxn: interval.priceMxn,
          intervalUnit: interval.intervalUnit,
          intervalFrequency: interval.intervalFrequency,
        });

        await prisma.plan.update({
          where: { id: plan.id },
          data: {
            [interval.field]: result.mpPlanId,
          },
        });

        console.log(`[sync-mp-plans] Creado ${plan.id}:${interval.label} -> ${result.mpPlanId}`);
      } catch (error) {
        const message = typeof error?.message === "string" ? error.message : "";
        if (message.includes("Cannot pay an amount greater than $ 10000.00")) {
          console.log(
            `[sync-mp-plans] Omitido ${plan.id}:${interval.label} porque MercadoPago no permite planes recurrentes mayores a 10000 MXN.`
          );
          continue;
        }

        throw error;
      }
    }
  }
} finally {
  await prisma.$disconnect();
}
