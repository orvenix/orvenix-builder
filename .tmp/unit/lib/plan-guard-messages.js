"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsiteLimitMessage = getWebsiteLimitMessage;
exports.getFeatureLimitMessage = getFeatureLimitMessage;
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
