import { createPrisma } from "./_client.mjs";

const PLAN_CATALOG = [
  {
    id: "starter",
    name: "Starter",
    priceMonthMxn: 1500,
    priceYearMxn: 15000,
    maxWebsites: 1,
    maxVisits: 15000,
    hasEcommerce: false,
    hasAI: false,
    hasExport: false,
    features: [
      "1 sitio institucional",
      "Hasta 5 paginas o secciones",
      "Editor visual completo",
      "SSL gratuito con renovacion automatica",
      "Hosting administrado premium",
      "Soporte estandar por email con SLA",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthMxn: 3900,
    priceYearMxn: 39000,
    maxWebsites: 10,
    maxVisits: 75000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Hasta 10 sitios independientes",
      "eCommerce avanzado sin comision Orvenix",
      "Orvenix AI para copy, optimizacion y traduccion",
      "CRM nativo completo",
      "Blog profesional y herramientas SEO",
      "Exportacion de codigo en formatos estandar",
    ],
  },
  {
    id: "commerce",
    name: "Business",
    priceMonthMxn: 7900,
    priceYearMxn: 79000,
    maxWebsites: 9999,
    maxVisits: 500000,
    hasEcommerce: true,
    hasAI: true,
    hasExport: true,
    features: [
      "Sitios ilimitados o segun acuerdo",
      "Funnels de venta ilimitados",
      "Automatizaciones complejas de marketing",
      "eCommerce multi-moneda",
      "CRM automatizado para leads y clientes",
      "Soporte omnicanal urgente",
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
