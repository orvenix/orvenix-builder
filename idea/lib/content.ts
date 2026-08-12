/* =========================================================================
   CONTENIDO EDITABLE DEL SITIO
   Absolutamente todo el texto visible del sitio vive en este archivo:
   navegación, botones, secciones, footer y páginas completas.
   Para cambiar cualquier palabra del sitio, edítala aquí — nunca hace
   falta tocar los componentes ni las páginas.
   ========================================================================= */

export type Feature = {
  iconName: "Layers" | "Palette" | "Zap" | "Globe" | "ShoppingBag" | "ShieldCheck";
  tag: string;
  title: string;
  description: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type ValueItem = {
  title: string;
  description: string;
};

export type SectionIntro = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type CtaBanner = {
  title: string;
  subtitle: string;
  buttonLabel: string;
};

export type FooterColumn = {
  heading: string;
  links: NavLink[];
};

/* --- Marca --- */

export const BRAND = {
  name: "Orvenix",
  tagline: "El constructor de sitios web para negocios y agencias en México",
  metaDescription:
    "Orvenix es la plataforma con la que agencias y negocios mexicanos publican sitios web a la medida en horas, no en semanas.",
};

/* --- Navegación --- */

export const NAV_LINKS: NavLink[] = [
  { label: "Producto", href: "/#producto" },
  { label: "Precios", href: "/#precios" },
  { label: "Clientes", href: "/#clientes" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Preguntas", href: "/#preguntas" },
];

export const NAVBAR = {
  loginLabel: "Iniciar sesión",
  loginHref: "/entrar",
  ctaLabel: "Empezar gratis",
  ctaHref: "/#precios",
};

/* --- Página de inicio: hero --- */

export const HERO = {
  eyebrow: "Constructor de sitios web · Hecho para México",
  title: "Crea un sitio web bonito y funcional sin complicarte",
  subtitle:
    "Orvenix es la plataforma con la que agencias y negocios mexicanos arman sitios web a su medida en horas, no en semanas. Bloques que acomodas a tu gusto, hosting incluido y todo explicado en español sencillo.",
  ctaPrimary: "Empezar gratis",
  ctaSecondary: "Ver una demo en vivo",
  note: "Sin tarjeta de crédito · Cancela cuando quieras",
};

export const BLOCK_CANVAS_ITEMS = [
  { id: "hero", label: "Portada", tone: "coral" as const },
  { id: "texto", label: "Texto", tone: "teal" as const },
  { id: "galeria", label: "Galería", tone: "amber" as const },
  { id: "cta", label: "Botón de contacto", tone: "coral" as const },
];

export const BLOCK_CANVAS_BROWSER_LABEL = "tunegocio.mx";
export const BLOCK_CANVAS_PANEL_TITLE = "Secciones";

/* --- Sección: características --- */

export const FEATURES_INTRO: SectionIntro = {
  eyebrow: "Plataforma",
  title: "Todo lo que necesita un sitio profesional, en un solo lugar",
  subtitle:
    "Desde el primer bloque hasta el dominio publicado, Orvenix cubre cada paso sin que tengas que combinar media docena de herramientas distintas.",
};

export const FEATURES: Feature[] = [
  {
    iconName: "Layers",
    tag: "Editor",
    title: "Editor de bloques en vivo",
    description:
      "Arrastra, suelta y reordena secciones sobre un lienzo real. Cada cambio se ve al instante, tal como quedará publicado.",
  },
  {
    iconName: "Palette",
    tag: "Diseño",
    title: "Identidad de marca en un clic",
    description:
      "Define colores, tipografías y estilos una sola vez y se aplican a todo el sitio. Plantillas listas para restaurantes, servicios, inmobiliarias y más.",
  },
  {
    iconName: "Globe",
    tag: "Publicación",
    title: "Dominio propio y hosting incluido",
    description:
      "Conecta tu dominio .mx o .com en minutos. El hosting, los certificados de seguridad y las actualizaciones corren por nuestra cuenta.",
  },
  {
    iconName: "ShoppingBag",
    tag: "Ventas",
    title: "Catálogo y pagos",
    description:
      "Agrega productos, precios y botones de pago o de WhatsApp sin instalar plugins ni depender de un desarrollador.",
  },
  {
    iconName: "Zap",
    tag: "Velocidad",
    title: "Sitios rápidos por diseño",
    description:
      "Cada página se genera optimizada de origen: carga rápida, buen puntaje en buscadores y una buena experiencia desde el primer clic.",
  },
  {
    iconName: "ShieldCheck",
    tag: "Respaldo",
    title: "Historial y deshacer sin límite",
    description:
      "Cada edición queda registrada. Si algo no te convence, regresa a cualquier versión anterior en un segundo.",
  },
];

/* --- Sección: precios --- */

export const PRICING_INTRO: SectionIntro = {
  eyebrow: "Precios",
  title: "Un plan para cada etapa de tu negocio",
  subtitle: "Empieza con lo esencial y sube de plan cuando lo necesites. Precios en pesos mexicanos.",
};

export const PRICING: PricingPlan[] = [
  {
    name: "Starter",
    price: "$249",
    period: "/mes + IVA",
    description: "Para un primer sitio profesional.",
    features: ["1 sitio publicado", "Plantillas base incluidas", "Dominio personalizado", "Soporte por correo"],
    highlight: false,
    cta: "Empezar con Starter",
  },
  {
    name: "Pro",
    price: "$599",
    period: "/mes + IVA",
    description: "Para negocios que ya venden en línea.",
    features: [
      "3 sitios publicados",
      "Catálogo y botones de pago",
      "Bloques y secciones avanzadas",
      "Soporte prioritario por WhatsApp",
    ],
    highlight: true,
    cta: "Empezar con Pro",
  },
  {
    name: "Business",
    price: "$1,299",
    period: "/mes + IVA",
    description: "Para agencias que atienden clientes.",
    features: [
      "10 sitios publicados",
      "Cuentas de equipo y roles",
      "Marca blanca para tus clientes",
      "Gestor de cuenta asignado",
    ],
    highlight: false,
    cta: "Empezar con Business",
  },
  {
    name: "Enterprise",
    price: "Cotización",
    period: "a la medida",
    description: "Para operaciones con necesidades específicas.",
    features: ["Sitios ilimitados", "Acuerdo de nivel de servicio (SLA)", "Integraciones a la medida", "Onboarding dedicado"],
    highlight: false,
    cta: "Hablar con ventas",
  },
];

export const PRICING_BADGE_LABEL = "Más elegido";

/* --- Sección: testimonios --- */

export const TESTIMONIALS_INTRO: SectionIntro = {
  eyebrow: "Clientes",
  title: "Negocios y agencias que ya construyen con Orvenix",
  subtitle: "",
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Antes tardábamos dos semanas en entregar un sitio a un cliente. Con Orvenix armamos la primera propuesta en una tarde y el cliente ya está viendo los cambios en vivo.",
    name: "Renata Duarte",
    role: "Directora creativa, Bloom Estudio Digital",
  },
  {
    quote:
      "Subí el catálogo de la taquería, conecté el botón de WhatsApp y el sitio ya estaba recibiendo pedidos ese mismo fin de semana.",
    name: "Iván Cárdenas",
    role: "Dueño, Taquería El Fogón",
  },
  {
    quote:
      "Manejamos doce sitios de clientes distintos desde una sola cuenta de agencia. El modo de marca blanca hizo que nuestros clientes ni notaran el cambio de plataforma.",
    name: "Paulina Reséndiz",
    role: "Socia, Estudio Márquez Arquitectura",
  },
];

/* --- Sección: preguntas frecuentes --- */

export const FAQ_INTRO: SectionIntro = {
  eyebrow: "Preguntas frecuentes",
  title: "Antes de que preguntes",
  subtitle: "",
};

export const FAQ: FaqItem[] = [
  {
    q: "¿Necesito saber programar para usar Orvenix?",
    a: "No. El editor funciona arrastrando y soltando bloques ya diseñados. Si en algún momento necesitas algo más específico, nuestro equipo puede ayudarte a personalizarlo.",
  },
  {
    q: "¿El hosting y el dominio están incluidos?",
    a: "El hosting está incluido en todos los planes. Puedes conectar un dominio que ya tengas o comprar uno nuevo directamente desde tu panel.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar cuando quiera?",
    a: "Sí. Puedes subir, bajar o cancelar tu plan en cualquier momento desde tu cuenta, sin penalizaciones ni llamadas.",
  },
  {
    q: "¿Los precios incluyen IVA?",
    a: "Los precios mostrados son antes de IVA. El desglose completo aparece en tu recibo y en el resumen antes de confirmar el pago.",
  },
  {
    q: "¿Ofrecen soporte en español?",
    a: "Sí, todo el soporte, la documentación y el producto están en español, con horario de atención pensado para México.",
  },
  {
    q: "¿Puedo vender productos o solo tener un sitio informativo?",
    a: "Ambos. Puedes usar Orvenix para un sitio de presentación o activar el catálogo y los botones de pago para empezar a vender.",
  },
];

/* --- Banners de llamado a la acción --- */

export const CTA_HOME: CtaBanner = {
  title: "Tu próximo sitio puede estar publicado hoy",
  subtitle: "Empieza gratis, arma tu primer bloque en minutos y decide después si quieres seguir.",
  buttonLabel: "Crear mi sitio gratis",
};

export const CTA_ABOUT: CtaBanner = {
  title: "¿Quieres conocer a fondo la plataforma?",
  subtitle: "Agenda una demo o empieza gratis hoy mismo, sin compromiso.",
  buttonLabel: "Empezar gratis",
};

/* --- Footer --- */

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Producto",
    links: [
      { label: "Características", href: "/#producto" },
      { label: "Precios", href: "/#precios" },
      { label: "Clientes", href: "/#clientes" },
    ],
  },
  {
    heading: "Empresa",
    links: [
      { label: "Sobre Orvenix", href: "/nosotros" },
      { label: "Contacto", href: "/contacto" },
      { label: "Soporte", href: "/#preguntas" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Términos de servicio", href: "/terminos" },
      { label: "Aviso de privacidad", href: "/privacidad" },
    ],
  },
];

export const FOOTER_BOTTOM_NOTE = "Hecho en México";

/* --- Página Nosotros --- */

export const ABOUT_HEADER = {
  eyebrow: "Nosotros",
  title: "Construimos la herramienta que a nosotros nos hubiera gustado tener",
  intro:
    "Orvenix nació al ver a agencias y negocios mexicanos perder semanas enteras coordinando desarrolladores, diseñadores y hosting solo para publicar un sitio sencillo. Decidimos construir la plataforma que junta todo eso en un solo lugar, pensada desde el inicio para el mercado mexicano.",
};

export const ABOUT_MISSION_VISION = {
  missionTitle: "Misión",
  mission: "Que cualquier negocio o agencia en México pueda publicar un sitio web profesional sin depender de un equipo técnico completo.",
  visionTitle: "Visión",
  vision: "Ser la plataforma de referencia para construir presencia web en Latinoamérica, empezando por México.",
};

export const STATS: StatItem[] = [
  { value: "+1,200", label: "Sitios publicados" },
  { value: "180", label: "Agencias activas" },
  { value: "32", label: "Estados con clientes Orvenix" },
  { value: "99.9%", label: "Disponibilidad del hosting" },
];

export const VALUES_INTRO: SectionIntro = {
  eyebrow: "Cómo trabajamos",
  title: "Los principios detrás de cada decisión de producto",
  subtitle: "",
};

export const VALUES: ValueItem[] = [
  {
    title: "Simplicidad primero",
    description: "Si una tarea toma más de tres clics, la rediseñamos. La complejidad es nuestro problema, no el tuyo.",
  },
  {
    title: "Hecho para México",
    description: "Precios en pesos, soporte en español y funciones pensadas para cómo se vende aquí: WhatsApp, catálogos, IVA.",
  },
  {
    title: "Control sin fricción",
    description: "Cada cambio se puede deshacer. Nadie debería tener miedo de experimentar con su propio sitio.",
  },
  {
    title: "Cercanía real",
    description: "Respondemos como equipo, no como ticket. Si algo no funciona, lo decimos y lo arreglamos.",
  },
];
