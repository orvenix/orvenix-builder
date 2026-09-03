export const officialDocument2026 = {
  title: "Dossier Corporativo Integral 2026",
  subtitle: "Marco Comercial, Tecnico, Operativo y Contractual de Servicios Digitales",
  version: "1.0 Oficial",
  year: "2026",
  owner: "Orvenix S.A. de C.V. (En constitucion)",
  scope: "Estados Unidos Mexicanos y Expansion LATAM",
  confidentiality: "Alta - uso comercial exclusivo y base legal de clientes",
  pdfPath: "/docs/orvenix_documento_oficial_2026.pdf",
} as const

export const officialCompanyIntro = {
  whatIs: [
    "Orvenix es una plataforma y ecosistema integral de infraestructura, software y diseno digital de ultima generacion.",
    "Resuelve en un solo entorno la presencia en linea, la automatizacion comercial y la escalabilidad operativa de negocios modernos.",
    "Integra diseno visual, infraestructura cloud elastica, inteligencia artificial, funnels, eCommerce y CRM nativo para eliminar la fragmentacion tecnologica.",
  ],
  howItWorks: [
    "Opera como Software e Infraestructura Gestionada como Servicio (Managed SaaS).",
    "Cada cliente selecciona un plan o proyecto a medida y recibe una instancia dedicada u optimizada en nube.",
    "Orvenix administra mantenimiento, actualizaciones, soporte preventivo y correctivo desde una consola centralizada para contenidos, metricas, CRM y ventas.",
  ],
  included: [
    "Alojamiento web premium en servidores cloud optimizados con redundancia geografica.",
    "Certificado SSL/TLS con cifrado extremo a extremo y renovacion automatica.",
    "Editor visual intuitivo drag and drop de alto rendimiento con codigo limpio.",
    "Monitoreo de Core Web Vitals y rendimiento.",
    "Soporte tecnico de infraestructura para continuidad operativa.",
  ],
} as const

export type OfficialPlanId = "starter" | "pro" | "business" | "enterprise"

export const officialPlans2026 = [
  {
    id: "starter",
    name: "Starter",
    audience: "Profesionales independientes, startups y marcas personales que necesitan presencia institucional administrada.",
    monthlyUsd: 15,
    monthlyVatUsd: 2.4,
    monthlyTotalUsd: 17.4,
    annualUsd: 150,
    annualVatUsd: 24,
    annualTotalUsd: 174,
    maxWebsites: 1,
    maxVisits: 15000,
    stripeEnvAlias: "STARTER",
    features: [
      "1 sitio institucional",
      "Hasta 5 paginas o secciones",
      "Editor visual completo",
      "SSL gratuito con renovacion automatica",
      "Hosting administrado premium",
      "Soporte estandar por email con SLA",
    ],
    limitations: [
      "No incluye eCommerce",
      "No incluye integraciones IA avanzadas",
      "No incluye exportacion de codigo fuente",
      "No incluye automatizaciones complejas de funnels",
      "Cambios mayores de estructura se cotizan por separado",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    audience: "Negocios en crecimiento que necesitan varios sitios, tienda, CRM, blog, SEO e inteligencia artificial.",
    monthlyUsd: 39,
    monthlyVatUsd: 6.24,
    monthlyTotalUsd: 45.24,
    annualUsd: 390,
    annualVatUsd: 62.4,
    annualTotalUsd: 452.4,
    maxWebsites: 10,
    maxVisits: 75000,
    stripeEnvAlias: "PRO",
    featured: true,
    features: [
      "Hasta 10 sitios independientes",
      "eCommerce avanzado sin comision transaccional de Orvenix",
      "Orvenix AI para copy, optimizacion, traduccion y analisis",
      "CRM nativo completo",
      "Blog profesional y herramientas SEO",
      "Exportacion de codigo en formatos estandar",
      "Soporte prioritario",
    ],
    limitations: [],
  },
  {
    id: "business",
    billingId: "commerce",
    name: "Business",
    audience: "Empresas que necesitan sitios ilimitados, funnels, automatizaciones y soporte omnicanal urgente.",
    monthlyUsd: 79,
    monthlyVatUsd: 12.64,
    monthlyTotalUsd: 91.64,
    annualUsd: 790,
    annualVatUsd: 126.4,
    annualTotalUsd: 916.4,
    maxWebsites: 9999,
    maxVisits: 500000,
    stripeEnvAlias: "BUSINESS",
    legacyStripeEnvAlias: "COMMERCE",
    features: [
      "Sitios ilimitados o conforme a acuerdo comercial",
      "Funnels de venta ilimitados",
      "Automatizaciones complejas de marketing",
      "eCommerce multi-moneda",
      "CRM automatizado para leads y clientes",
      "Soporte por WhatsApp, chat en tiempo real y email corporativo urgente",
    ],
    limitations: [],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "Organizaciones con arquitectura dedicada, SLA premium, integraciones ERP/API y gestor asignado.",
    monthlyUsd: null,
    monthlyVatUsd: null,
    monthlyTotalUsd: null,
    annualUsd: null,
    annualVatUsd: null,
    annualTotalUsd: null,
    maxWebsites: 9999,
    maxVisits: 999999,
    stripeEnvAlias: "ENTERPRISE",
    features: [
      "Arquitectura dedicada a medida",
      "IA personalizada o API dedicada",
      "Integraciones ERP, CRM externo y sistemas corporativos",
      "eCommerce B2B y flujos complejos",
      "SLA premium y gestor dedicado",
    ],
    limitations: ["Se cotiza segun proyecto, alcance tecnico y nivel de soporte requerido."],
  },
] as const

export const officialPlanComparison2026 = [
  ["Numero de sitios web", "1", "10", "Ilimitados / avanzado", "A medida / dedicado"],
  ["Paginas internas", "Hasta 5", "Ilimitadas", "Ilimitadas", "Ilimitadas"],
  ["Editor visual", "Si", "Si", "Si", "Si"],
  ["IA corporativa", "No", "Estandar", "Avanzada", "Personalizada / API dedicada"],
  ["eCommerce", "No", "Si", "Multi-moneda", "B2B / arquitectura compleja"],
  ["CRM integrado y leads", "Basico", "Completo", "Automatizado", "Integracion ERP externa"],
  ["Funnels", "No", "Hasta 5", "Ilimitados", "Ilimitados"],
  ["SEO y blog", "Basico", "Avanzado", "Avanzado", "Estrategia a medida"],
  ["Exportacion de codigo y datos", "No", "Si", "Si", "Si"],
  ["Infraestructura", "1 dominio", "Multi-dominio", "Multi-dominio", "Infraestructura dedicada"],
  ["Soporte", "Email 48 hrs", "Prioritario 24 hrs", "Omnicanal urgente", "SLA premium / gestor dedicado"],
] as const

export const officialAddons2026 = [
  { name: "Pagina o seccion extra estandar", price: "Desde 45 USD", cadence: "Pago unico", applies: "Principalmente Starter" },
  { name: "Idioma adicional multi-idioma", price: "Desde 150 USD", cadence: "Pago unico", applies: "Sitios multi-mercado" },
  { name: "Estrategia SEO avanzada", price: "290 USD", cadence: "Pago unico", applies: "Auditoria, keywords y optimizacion" },
  { name: "Diseno personalizado UI/UX", price: "Desde 600 USD", cadence: "Por proyecto", applies: "Interfaces a medida" },
  { name: "Integraciones con APIs, CRMs o ERPs", price: "65 USD/hora", cadence: "Ingenieria", applies: "SAP, Salesforce, Aspel y sistemas externos" },
  { name: "Migracion tecnologica", price: "Base 200 USD", cadence: "Pago unico", applies: "WordPress, Shopify, Wix hacia Orvenix" },
  { name: "Capacitacion corporativa", price: "120 USD", cadence: "Sesion de 2 horas", applies: "Equipos internos" },
] as const

export const officialGeneralTerms2026 = {
  billing: [
    "Los precios oficiales se expresan en USD y causan IVA conforme a la legislacion aplicable.",
    "En Mexico, el pago puede convertirse a MXN usando el tipo de cambio del Banco de Mexico vigente en la fecha de cobro o factura.",
    "Se aceptan tarjeta de credito/debito y SPEI segun disponibilidad operativa.",
    "La factura debe solicitarse dentro del mismo mes calendario del pago con RFC, regimen fiscal, codigo postal y uso CFDI.",
  ],
  renewals: [
    "Los planes mensuales y anuales son recurrentes y se renuevan automaticamente.",
    "La cancelacion debe solicitarse desde el panel administrativo al menos 5 dias naturales antes del corte del servicio.",
    "Hay 3 dias de gracia por atraso; despues puede suspenderse la plataforma y el sitio publico.",
    "Tras 30 dias naturales de suspension por falta de pago, Orvenix puede eliminar archivos de servidor sin responsabilidad por perdida de datos o software.",
  ],
  refunds: [
    "No hay reembolsos en planes mensuales ni add-ons ejecutados.",
    "En planes anuales, la cancelacion con reembolso solo aplica dentro de los primeros 7 dias naturales posteriores al pago inicial.",
    "En reembolsos anuales autorizados se retiene 15% por costos administrativos y de aprovisionamiento.",
  ],
} as const

export const officialBuyout2026 = {
  title: "Compra definitiva de software y sitio",
  rights: [
    "Tras el pago total, el cliente recibe derechos patrimoniales perpetuos, universales e irrevocables sobre el codigo personalizado entregado.",
    "El cliente puede modificar, revender, duplicar o licenciar el desarrollo personalizado sin regalias adicionales.",
    "Orvenix conserva derechos morales, librerias base y componentes propietarios no transferidos expresamente.",
  ],
  postSale: [
    "El cliente puede conservar la infraestructura de Orvenix mediante un plan de hosting y mantenimiento a medida.",
    "En migracion externa, Orvenix entrega .zip y/o .sql; despues de la conformidad, el soporte se factura por hora.",
  ],
} as const

export const officialSla2026 = {
  uptime: "99.9% de disponibilidad mensual, 24/7/365, excluyendo mantenimiento programado, fuerza mayor y ventanas notificadas con 24 horas de anticipacion.",
  maintenanceWindow: "02:00 a 05:00 CST en periodos de bajo trafico.",
  severities: [
    { level: "Critica / Alta", examples: "Sitio completamente caido en produccion o error critico de pasarela de pago", response: "< 2 horas", resolution: "6 horas naturales objetivo" },
    { level: "Moderada / Media", examples: "Fallos visuales no criticos, formularios secundarios o problemas en consola IA", response: "< 12 horas", resolution: "24 horas habiles objetivo" },
    { level: "Leve / Baja", examples: "Uso general, configuracion de contenido o paginas complementarias", response: "< 24 horas", resolution: "48 horas habiles objetivo" },
  ],
  backups: [
    "Backups completos diarios de archivos y base de datos.",
    "Copias cifradas en servidores externos geo-aislados.",
    "Historial movil de 30 dias para Pro/Business y 7 dias para Starter.",
    "La restauracion por error del cliente genera cargo administrativo.",
  ],
} as const

export const officialContractClauses2026 = [
  { title: "Objeto", body: "Orvenix presta desarrollo digital, hosting, acceso a software, herramientas IA y soporte conforme al plan contratado, sus limites y especificaciones." },
  { title: "Contraprestacion y pago", body: "El cliente paga por adelantado las cuotas mensuales o anuales vigentes, mas IVA y cargos adicionales aceptados." },
  { title: "Vigencia y renovacion", body: "La vigencia corresponde al periodo contratado y se renueva automaticamente salvo aviso de no renovacion conforme a condiciones generales." },
  { title: "Propiedad intelectual y contenidos", body: "El cliente declara contar con derechos sobre sus materiales. Salvo compra definitiva, la plataforma, arquitectura y software base siguen siendo propiedad de Orvenix." },
  { title: "Limitacion de responsabilidad", body: "Orvenix no responde por lucro cesante, interrupcion de negocio, danos indirectos, perdida de datos por mal uso, ataques externos o eventos fuera del SLA." },
  { title: "Jurisdiccion", body: "Las partes se someten a la legislacion mexicana y a los tribunales competentes de Monterrey, Nuevo Leon." },
] as const

export const officialFinancialAppendix2026 = [
  { concept: "Reconexion por suspension de pago", amount: "25 USD + IVA" },
  { concept: "Restauracion de backup por error del cliente", amount: "40 USD + IVA" },
  { concept: "Penalizacion por cancelacion anual temprana", amount: "15% del total pagado" },
  { concept: "Hora adicional de ingenieria", amount: "65 USD + IVA" },
] as const

export const officialUpdatePolicy2026 = {
  included: [
    "Parches criticos de seguridad de servidor y nucleo del constructor visual.",
    "Actualizaciones menores de compatibilidad con Chrome, Safari, Edge y Firefox.",
    "Actualizaciones de infraestructura IA para modelos de lenguaje.",
    "Correccion de bugs nativos del software Orvenix.",
  ],
  extraCost: [
    "Cambios estructurales de interfaz o rebranding posterior a la entrega.",
    "Carga masiva de catalogos de productos no realizada por el cliente.",
    "Nuevas secciones o landing pages que excedan el limite del plan contratado.",
  ],
  requiredUpgrades: [
    "Starter requiere upgrade a Pro al necesitar una sexta pagina interna.",
    "Starter requiere upgrade a Pro para carrito, inventario, pasarela de pago o checkout.",
    "Starter requiere upgrade a Pro para administrar un segundo sitio independiente.",
    "Tráfico recurrente que comprometa un nodo compartido puede requerir Business o Enterprise.",
  ],
} as const

export function normalizeOfficialPlanId(planId: string): OfficialPlanId | null {
  if (planId === "commerce") return "business"
  if (["starter", "pro", "business", "enterprise"].includes(planId)) return planId as OfficialPlanId
  return null
}

export function getOfficialPlan(planId: string) {
  const normalized = normalizeOfficialPlanId(planId)
  return normalized ? officialPlans2026.find((plan) => plan.id === normalized) ?? null : null
}

export function getOfficialPlanName(planId: string, fallback?: string | null) {
  return getOfficialPlan(planId)?.name ?? fallback ?? planId
}

export function formatUsd(value: number | null) {
  if (value === null) return "Cotizacion"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}
