import { notFound, redirect } from "next/navigation";
import { getPublishedSite } from "@/lib/auth";
import { PublicRenderer } from "@/components/PublicRenderer";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";
import { getPublishedSitePublicPath, hasPublishedSiteArtifact } from "@/lib/publishedSiteArtifacts";
import { trackPageView } from "@/lib/analytics";
import { SiteCopyrightBar, parseSiteOwnership } from "@/components/SiteCopyrightBar";
import { getFunnel } from "@/lib/commerce/funnels";
import { FunnelStepOfferCallout } from "@/components/FunnelStepOfferCallout";
import { getPublicFunnelOfferCallout, getPublicFunnelOfferQuery } from "@/lib/commerce/funnel-offer-public";
import { getPublicCheckoutStatusNotice } from "@/lib/commerce/funnel-checkout-status";
import { FunnelCheckoutStatusNotice } from "@/components/FunnelCheckoutStatusNotice";
import { buildPublicFunnelActionHref } from "@/lib/commerce/public-funnel-url";
import { getFunnelStepActionLabel } from "@/lib/commerce/funnel-step-copy";
import { buildFunnelStepRedirectPath, getNextFunnelStepContext, isFunnelStepKind } from "@/lib/commerce/funnel-runtime";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSeoTitle(seo: unknown, fallback: string) {
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return fallback;
  const value = (seo as { title?: unknown }).title;
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function PublicPage({ params, searchParams }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);

  if (!site) notFound();

  // Registrar visita de forma asíncrona — no bloquea el renderizado
  trackPageView(id).catch(() => {})
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const funnelId = typeof resolvedSearchParams?.funnelId === "string" ? resolvedSearchParams.funnelId : ""
  const funnelStep = typeof resolvedSearchParams?.funnelStep === "string" ? resolvedSearchParams.funnelStep : ""
  const funnelStepId = typeof resolvedSearchParams?.funnelStepId === "string" ? resolvedSearchParams.funnelStepId : ""
  const storeCheckout = typeof resolvedSearchParams?.storeCheckout === "string" ? resolvedSearchParams.storeCheckout : ""
  const orderId = typeof resolvedSearchParams?.orderId === "string" ? resolvedSearchParams.orderId : ""
  const offerType = typeof resolvedSearchParams?.offerType === "string" ? resolvedSearchParams.offerType : ""
  const offerLabel = typeof resolvedSearchParams?.offerLabel === "string" ? resolvedSearchParams.offerLabel : ""
  const offerValue = typeof resolvedSearchParams?.offerValue === "string" ? resolvedSearchParams.offerValue : ""
  const currentPath = `/p/${encodeURIComponent(id)}`
  const retryHref = buildPublicFunnelActionHref(currentPath, resolvedSearchParams, {
    cart: "open",
    storeCheckout: null,
    orderId: null,
  })
  const dismissHref = buildPublicFunnelActionHref(currentPath, resolvedSearchParams, {
    cart: null,
    storeCheckout: null,
    orderId: null,
  })
  const experimentId = typeof resolvedSearchParams?.experimentId === "string" ? resolvedSearchParams.experimentId : ""
  const experimentVariant = typeof resolvedSearchParams?.experimentVariant === "string" ? resolvedSearchParams.experimentVariant : ""
  if (funnelId && (funnelStep === "landing" || funnelStep === "checkout" || funnelStep === "upsell" || funnelStep === "downsell" || funnelStep === "thankyou")) {
    const { trackFunnelEvent } = await import("@/lib/commerce/funnel-analytics")
    trackFunnelEvent({ siteId: id, funnelId, step: funnelStep, eventType: "step_view" }).catch(() => {})
  }
  const nextStep = (
    funnelId
    && isFunnelStepKind(funnelStep)
    && (funnelStep === "checkout" || funnelStep === "upsell" || funnelStep === "downsell")
  )
    ? await getNextFunnelStepContext(id, funnelId, {
        stepId: funnelStepId || undefined,
        stepKind: funnelStep,
      })
    : null
  const semanticStepHref = (
    funnelId
    && (funnelStep === "checkout" || funnelStep === "upsell" || funnelStep === "downsell" || funnelStep === "thankyou")
  )
    ? await buildFunnelStepRedirectPath({
        siteId: id,
        funnelId,
        targetStepId: storeCheckout === "success" ? nextStep?.stepId : (funnelStepId || undefined),
        targetStep: storeCheckout === "success" ? (nextStep?.stepKind ?? "thankyou") : funnelStep,
        fallbackPath: dismissHref,
        searchParams: {
          funnelId,
          funnelStep: storeCheckout === "success" ? (nextStep?.stepKind ?? "thankyou") : funnelStep,
          funnelStepId: storeCheckout === "success" ? nextStep?.stepId : (funnelStepId || undefined),
          experimentId: experimentId || undefined,
          experimentVariant: experimentVariant || undefined,
        },
      })
    : null
  const checkoutNotice = getPublicCheckoutStatusNotice(storeCheckout, orderId, storeCheckout === "success"
    ? {
        primaryHref: semanticStepHref ?? dismissHref,
        primaryLabel: semanticStepHref ? getFunnelStepActionLabel(nextStep?.stepKind ?? "thankyou", "advance") : "Continuar",
        secondaryHref: dismissHref,
        secondaryLabel: "Cerrar aviso",
        offerType,
        offerLabel,
        offerValue,
      }
    : storeCheckout === "pending"
      ? {
          primaryHref: semanticStepHref ?? dismissHref,
          primaryLabel: semanticStepHref ? getFunnelStepActionLabel(isFunnelStepKind(funnelStep) ? funnelStep : null, "return") : "Continuar",
          secondaryHref: retryHref,
          secondaryLabel: "Abrir carrito",
          offerType,
          offerLabel,
          offerValue,
        }
      : storeCheckout === "failure"
        ? {
            primaryHref: semanticStepHref ?? dismissHref,
            primaryLabel: semanticStepHref ? getFunnelStepActionLabel(isFunnelStepKind(funnelStep) ? funnelStep : null, "return") : "Continuar",
            secondaryHref: retryHref,
            secondaryLabel: "Reintentar pago",
            offerType,
            offerLabel,
            offerValue,
          }
        : undefined)

  let funnelOffer = null
  if (funnelId && (funnelStep === "upsell" || funnelStep === "downsell")) {
    const funnel = await getFunnel(id, funnelId)
    const step = funnel?.steps?.find((entry) =>
      funnelStepId ? entry.id === funnelStepId : entry.kind === funnelStep
    )
    if (step) {
      const offerQuery = getPublicFunnelOfferQuery(step.kind, step.settings)
      funnelOffer = getPublicFunnelOfferCallout(step.kind, step.settings, {
        acceptHref: buildPublicFunnelActionHref(currentPath, resolvedSearchParams, {
          cart: "open",
          storeCheckout: null,
          orderId: null,
          offerStepKind: offerQuery?.offerStepKind,
          offerType: offerQuery?.offerType,
          offerLabel: offerQuery?.offerLabel,
          offerValue: offerQuery?.offerValue,
          offerDiscountPercent: offerQuery?.offerDiscountPercent,
          offerDiscountFixed: offerQuery?.offerDiscountFixed,
          offerPriceMxn: offerQuery?.offerPriceMxn,
        }),
        declineHref: dismissHref,
      })
    }
  }

  if (await hasPublishedSiteArtifact(id)) {
    redirect(getPublishedSitePublicPath(id));
  }

  let runtimeContext;
  try {
    runtimeContext = await getResolvedSiteRuntimeContext(id);
  } catch {
    notFound();
  }

  if (!runtimeContext) {
    notFound();
  }

  const ownership = parseSiteOwnership(site.description)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {checkoutNotice && <FunnelCheckoutStatusNotice notice={checkoutNotice} />}
        {funnelOffer && <FunnelStepOfferCallout offer={funnelOffer} />}
        <PublicRenderer
          siteId={id}
          tree={runtimeContext.tree}
          activePageSlug={runtimeContext.activePageSlug}
          activePageName={runtimeContext.activePageName}
          availablePages={runtimeContext.pages}
        />
      </div>
      <SiteCopyrightBar siteName={site.name} ownership={ownership} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);
  const runtimeContext = site ? await getResolvedSiteRuntimeContext(id) : null;
  return { title: getSeoTitle(runtimeContext?.page.seo, site?.name ?? "Orvenix") };
}
