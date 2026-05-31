"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsiteLimitMessage = getWebsiteLimitMessage;
exports.getFeatureLimitMessage = getFeatureLimitMessage;
exports.getUserPlanAccess = getUserPlanAccess;
exports.requireActivePlan = requireActivePlan;
exports.requireCanCreateWebsite = requireCanCreateWebsite;
exports.requireEcommercePlan = requireEcommercePlan;
exports.requireExportPlan = requireExportPlan;
exports.requireAIPlan = requireAIPlan;
const editor_db_1 = require("@/lib/editor-db");
function getWebsiteLimitMessage(access) {
    if (!access.isActive || !access.plan) {
        return "Necesitas un plan activo para crear sitios. Actualiza tu plan en /precios.";
    }
    const limit = access.plan.maxWebsites;
    return `Has alcanzado el límite de ${limit} sitio${limit === 1 ? "" : "s"} de tu plan. Actualiza tu plan en /precios.`;
}
function getFeatureLimitMessage(feature) {
    if (feature === "ecommerce")
        return "El e-commerce requiere un plan con tienda incluida. Actualiza tu plan en /precios.";
    if (feature === "export")
        return "La exportacion requiere un plan Pro o superior. Actualiza tu plan en /precios.";
    return "Orvenix AI requiere un plan con IA incluida. Actualiza tu plan en /precios.";
}
/** Retorna el acceso al plan del usuario. Usar en Server Components y API routes. */
async function getUserPlanAccess(userId) {
    const subscription = await editor_db_1.editorPrisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    });
    const isActive = (subscription === null || subscription === void 0 ? void 0 : subscription.status) === "active" || (subscription === null || subscription === void 0 ? void 0 : subscription.status) === "authorized";
    const websitesUsed = await editor_db_1.editorPrisma.editorWebsite.count({
        where: { userId },
    });
    if (!isActive || !subscription) {
        return { isActive: false, plan: null, websitesUsed, canCreateWebsite: false };
    }
    const { plan } = subscription;
    return {
        isActive,
        plan: {
            id: plan.id,
            name: plan.name,
            maxWebsites: plan.maxWebsites,
            maxVisits: plan.maxVisits,
            hasEcommerce: plan.hasEcommerce,
            hasAI: plan.hasAI,
            hasExport: plan.hasExport,
        },
        websitesUsed,
        canCreateWebsite: websitesUsed < plan.maxWebsites,
    };
}
/** Guard para API routes — retorna 403 si el usuario no tiene plan activo */
async function requireActivePlan(userId) {
    const access = await getUserPlanAccess(userId);
    if (!access.isActive)
        return null;
    return access;
}
/** Guard para cualquier flujo que cree un sitio nuevo. */
async function requireCanCreateWebsite(userId) {
    const access = await getUserPlanAccess(userId);
    if (!access.canCreateWebsite) {
        throw new Error(getWebsiteLimitMessage(access));
    }
    return access;
}
async function requireEcommercePlan(userId) {
    var _a;
    const access = await getUserPlanAccess(userId);
    if (!((_a = access.plan) === null || _a === void 0 ? void 0 : _a.hasEcommerce)) {
        throw new Error(getFeatureLimitMessage("ecommerce"));
    }
    return access;
}
async function requireExportPlan(userId) {
    var _a;
    const access = await getUserPlanAccess(userId);
    if (!((_a = access.plan) === null || _a === void 0 ? void 0 : _a.hasExport)) {
        throw new Error(getFeatureLimitMessage("export"));
    }
    return access;
}
async function requireAIPlan(userId) {
    var _a;
    const access = await getUserPlanAccess(userId);
    if (!((_a = access.plan) === null || _a === void 0 ? void 0 : _a.hasAI)) {
        throw new Error(getFeatureLimitMessage("ai"));
    }
    return access;
}
