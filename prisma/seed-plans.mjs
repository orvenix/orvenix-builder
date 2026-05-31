import { createPrisma } from "./_client.mjs";

const PLAN_CATALOG = [
  {
    id: "starter",
    name: "Basico",
    priceMonthMxn: 349,
    priceYearMxn: 3350,
    maxWebsites: 1,
    maxVisits: 15000,
    hasEcommerce: false,
    hasAI: true,
    hasExport: false,
    features: [
      "1 sitio publicado",
      "Editor visual completo",
      "SSL y hosting administrado",
      "Soporte por email y WhatsApp",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthMxn: 699,
    priceYearMxn: 6710,
    maxWebsites: 3,
    maxVisits: 75000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Hasta 3 sitios",
      "CMS editable por colecciones",
      "Tienda online integrada",
      "Exportacion de codigo",
    ],
  },
  {
    id: "commerce",
    name: "Empresa",
    priceMonthMxn: 1399,
    priceYearMxn: 13430,
    maxWebsites: 9999,
    maxVisits: 500000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Sitios ilimitados",
      "Billing y operaciones avanzadas",
      "Webhooks y automatizaciones",
      "Soporte prioritario",
    ],
  },
];

const prisma = createPrisma();

try {
  for (const plan of PLAN_CATALOG) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        priceMonthMxn: plan.priceMonthMxn,
        priceYearMxn: plan.priceYearMxn,
        maxWebsites: plan.maxWebsites,
        maxVisits: plan.maxVisits,
        hasEcommerce: plan.hasEcommerce,
        hasAI: plan.hasAI,
        hasExport: plan.hasExport,
        features: plan.features,
        isActive: true,
      },
      create: {
        ...plan,
        isActive: true,
      },
    });
    console.log(`[seed] Plan listo: ${plan.id}`);
  }
} finally {
  await prisma.$disconnect();
}
