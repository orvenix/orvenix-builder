"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplexBlockMeta = getComplexBlockMeta;
exports.resolveExportHref = resolveExportHref;
exports.resolveExportNavModel = resolveExportNavModel;
const pageLinks_1 = require("../tree/pageLinks");
const siteNavigation_1 = require("../tree/siteNavigation");
const COMPLEX_BLOCK_META = {
    "landing-hero": { label: "Hero principal", tag: "header", icon: "🚀", heading: "Hero principal", description: "Bloque hero de apertura con propuesta de valor y llamada a la acción." },
    "landing-features": { label: "Características", tag: "section", icon: "✨", heading: "Características", description: "Resumen de funcionalidades o beneficios clave del producto o servicio." },
    "landing-pricing": { label: "Precios", tag: "section", icon: "💰", heading: "Precios", description: "Comparativa de planes, precios y condiciones principales." },
    "landing-testimonials": { label: "Testimonios", tag: "section", icon: "⭐", heading: "Testimonios", description: "Sección de prueba social con testimonios y señales de confianza." },
    "landing-footer": { label: "Pie de página", tag: "footer", icon: "📄", heading: "Pie de página", description: "Pie del sitio con enlaces, cierre de marca y contenido secundario." },
    "agency-hero": { label: "Hero agencia", tag: "header", icon: "🎯", heading: "Hero de agencia", description: "Apertura principal enfocada en posicionamiento de agencia o estudio." },
    "agency-services": { label: "Servicios", tag: "section", icon: "🛠", heading: "Servicios", description: "Listado o grilla de servicios destacados de la agencia." },
    "agency-testimonials": { label: "Testimonios agencia", tag: "section", icon: "💬", heading: "Testimonios", description: "Prueba social orientada a credibilidad comercial y casos de éxito." },
    "agency-cta": { label: "Llamada a la acción", tag: "section", icon: "📣", heading: "Llamada a la acción", description: "Cierre enfocado en conversión, contacto o WhatsApp." },
    "saas-pricing": { label: "Precios SaaS", tag: "section", icon: "📊", heading: "Planes SaaS", description: "Comparación de suscripciones, límites y beneficios del producto SaaS." },
    "stats-bar": { label: "Estadísticas", tag: "section", icon: "📈", heading: "Estadísticas", description: "Bloque breve para métricas, hitos o indicadores de desempeño." },
    "product-grid": { label: "Cuadrícula de productos", tag: "section", icon: "🛒", heading: "Productos", description: "Grilla de productos o elementos comerciales disponibles." },
    "crm-pipeline": { label: "Pipeline CRM", tag: "section", icon: "🔄", heading: "Pipeline CRM", description: "Visualización del flujo comercial o del embudo de ventas." },
    "crm-contacts": { label: "Contactos", tag: "section", icon: "👥", heading: "Contactos", description: "Listado o tabla de contactos dentro del flujo CRM." },
    "crm-stats": { label: "Métricas CRM", tag: "section", icon: "📋", heading: "Métricas CRM", description: "Indicadores clave del desempeño del equipo o del pipeline." },
    "modular-hero": { label: "Hero enterprise", tag: "header", icon: "🏢", heading: "Hero enterprise", description: "Bloque principal para propuesta enterprise con arquitectura y CTAs." },
    "modular-architecture": { label: "Arquitectura", tag: "section", icon: "🏛", heading: "Arquitectura", description: "Explicación estructurada de módulos, capas o componentes del sistema." },
    "modular-capabilities": { label: "Capacidades", tag: "section", icon: "⚡", heading: "Capacidades", description: "Resumen de capacidades operativas o técnicas del producto." },
    "modular-contact-form": { label: "Formulario de contacto", tag: "section", icon: "📬", heading: "Formulario de contacto", description: "Bloque de contacto para captación de leads o solicitudes." },
    "modular-footer": { label: "Pie enterprise", tag: "footer", icon: "🔗", heading: "Pie enterprise", description: "Pie del sitio enterprise con navegación secundaria y enlaces." },
    "modular-process": { label: "Proceso de trabajo", tag: "section", icon: "🗂", heading: "Proceso de trabajo", description: "Sección que describe pasos, metodología o fases del servicio." },
    "modular-trust-bar": { label: "Barra de confianza", tag: "section", icon: "🛡", heading: "Barra de confianza", description: "Franja breve con sellos, logos o mensajes de confianza." },
    "ai-charts": { label: "Gráficos IA", tag: "section", icon: "📊", heading: "Gráficos", description: "Bloque analítico con visualizaciones y métricas derivadas." },
    "ai-insights": { label: "Insights IA", tag: "section", icon: "🔍", heading: "Insights", description: "Hallazgos o recomendaciones generadas a partir de datos." },
    "ai-kpi-grid": { label: "KPIs", tag: "section", icon: "🎯", heading: "KPIs", description: "Resumen de indicadores clave en formato compacto." },
    "finance-stats": { label: "Estadísticas financieras", tag: "section", icon: "💹", heading: "Estadísticas financieras", description: "Resumen de indicadores financieros o comerciales." },
    "hr-employee-table": { label: "Tabla de empleados", tag: "section", icon: "🧑‍💼", heading: "Equipo", description: "Sección tabular o estructurada para personal y recursos humanos." },
    "devops-server-grid": { label: "Servidores", tag: "section", icon: "🖥", heading: "Servidores", description: "Inventario o panel de infraestructura y servidores." },
};
function getComplexBlockMeta(type) {
    var _a;
    return (_a = COMPLEX_BLOCK_META[type]) !== null && _a !== void 0 ? _a : null;
}
function resolveExportHref(siteId, href) {
    return (0, pageLinks_1.resolveRuntimeHref)(siteId !== null && siteId !== void 0 ? siteId : null, href, "export");
}
function resolveExportNavModel(props, options) {
    var _a, _b;
    const navPages = (0, siteNavigation_1.resolveSiteNavPages)((_a = options === null || options === void 0 ? void 0 : options.pages) !== null && _a !== void 0 ? _a : [], {
        showHome: props.showHome !== false,
        hiddenSlugs: typeof props.hiddenSlugs === "string" ? props.hiddenSlugs : "",
    });
    const layout = props.layout === "column" ? "column" : "row";
    const justify = props.justify === "center" ? "center" : props.justify === "end" ? "end" : "start";
    const variant = props.variant === "minimal" ? "minimal" : "pill";
    return {
        ariaLabel: String((_b = props.title) !== null && _b !== void 0 ? _b : "Navegación"),
        navClass: `site-nav site-nav--${layout} site-nav--${justify} site-nav--${variant}`,
        links: navPages.map((page) => {
            var _a, _b;
            return ({
                slug: page.slug,
                name: page.name,
                href: resolveExportHref((_a = options === null || options === void 0 ? void 0 : options.siteId) !== null && _a !== void 0 ? _a : null, `page:${page.slug}`),
                isActive: page.slug === ((_b = options === null || options === void 0 ? void 0 : options.currentPageSlug) !== null && _b !== void 0 ? _b : "home"),
            });
        }),
    };
}
