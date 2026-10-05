import type { CheckoutAction } from "@/lib/pendingDesignDraft";

export function buildCheckoutRedirectUrl(action: CheckoutAction, siteId: string, templateId?: string | null) {
  const params = new URLSearchParams({
    intent: action,
    siteId,
  });

  if (templateId) params.set("templateId", templateId);

  return `/checkout?${params.toString()}`;
}

export function normalizeCheckoutAction(value: string | null | undefined): CheckoutAction {
  return value === "buy" ? "buy" : "rent";
}

export function getCheckoutCopy(action: CheckoutAction) {
  return action === "buy"
    ? {
        title: "Compra del sitio",
        badge: "Compra unica",
        cta: "Confirmar compra",
        description:
          "Obtienes el entregable de tu sitio en tu cuenta con la exportacion de su codigo habilitada. La plataforma y el diseño base siguen siendo de Orvenix.",
        summary:
          "Proceso listo para conectar con Stripe o MercadoPago en el siguiente paso.",
      }
    : {
        title: "Renta mensual del sitio",
        badge: "Suscripcion mensual",
        cta: "Confirmar renta",
        description:
          "Activas tu sitio en modalidad de renta y mantienes el flujo de publicacion desde el panel privado.",
        summary:
          "Proceso listo para conectar con Stripe o MercadoPago en el siguiente paso.",
      };
}

export function buildCheckoutSuccessUrl(action: CheckoutAction, siteId: string) {
  return `/dashboard?checkout=pending&intent=${action}&siteId=${encodeURIComponent(siteId)}`;
}
