"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import {
  createPendingDesignKey,
  type CheckoutAction,
  type PendingDesignDraft,
} from "@/lib/pendingDesignDraft";
import { isEditorWebId } from "@/lib/editorWebs";
import type { EditorTree } from "@/types/editor";

interface CheckoutFlowOptions {
  action: CheckoutAction;
  siteId?: string | null;
  tree?: EditorTree;
}

export function useCheckoutRegistrationFlow() {
  const router = useRouter();
  const { status } = useSession();
  const storeTree = useEditorStore((s) => s.tree);
  const storeWebsiteId = useEditorStore((s) => s.websiteId);

  const normalizeSiteId = (siteId?: string | null) =>
    siteId && !siteId.startsWith("draft:") ? siteId : null;

  async function startCheckout({
    action,
    siteId = storeWebsiteId,
    tree = storeTree,
  }: CheckoutFlowOptions) {
    const templateId = siteId && isEditorWebId(siteId) ? siteId : null;
    const checkoutSiteId = templateId ? null : normalizeSiteId(siteId);

    if (status === "authenticated") {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, siteId: checkoutSiteId, templateId, tree }),
      });

      const payload = (await response.json()) as {
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.redirectUrl) {
        throw new Error(payload.error ?? "No se pudo iniciar el checkout.");
      }

      router.push(payload.redirectUrl);
      return;
    }

    const key = createPendingDesignKey();
    const draft: PendingDesignDraft = {
      version: 1,
      key,
      action,
      sourceSiteId: checkoutSiteId,
      draftWebsiteId: siteId?.startsWith("draft:") ? siteId : null,
      tree,
      createdAt: new Date().toISOString(),
      returnTo: "/dashboard",
    };

    localStorage.setItem(key, JSON.stringify(draft));

    const params = new URLSearchParams({
      pendingDesignKey: key,
      checkoutAction: action,
      returnTo: "/dashboard",
      callbackUrl: "/dashboard",
    });

    router.push(`/register?${params.toString()}`);
  }

  return {
    startCheckout,
    isCheckingSession: status === "loading",
  };
}
