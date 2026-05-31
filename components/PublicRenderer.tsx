"use client";

import { useEffect } from "react";
import { EditorProvider } from "@/components/editor/store/EditorProvider";
import { DynamicRenderer } from "@/components/editor/DynamicRenderer";
import { getRuntimeDeviceFromWidth } from "@/lib/builder-core/runtime/rendering";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { SitePageListItem } from "@/lib/builder-core/tree/sitePages";
import type { EditorTree } from "@/types/editor";

export function PublicRenderer({
  siteId,
  tree,
  activePageSlug = "home",
  activePageName = "Inicio",
  availablePages = [],
}: {
  siteId: string;
  tree: EditorTree;
  activePageSlug?: string;
  activePageName?: string;
  availablePages?: SitePageListItem[];
}) {
  return (
    <EditorProvider
      websiteId={siteId}
      initialTree={tree}
      initialPageSlug={activePageSlug}
      initialPageName={activePageName}
      availablePages={availablePages}
    >
      <ViewportDeviceSync />
      <DynamicRenderer mode="preview" />
    </EditorProvider>
  );
}

function ViewportDeviceSync() {
  const setDevice = useEditorStore((s) => s.setDevice);

  useEffect(() => {
    const syncDevice = () => {
      setDevice(getRuntimeDeviceFromWidth(window.innerWidth));
    };

    syncDevice();
    window.addEventListener("resize", syncDevice);
    window.addEventListener("orientationchange", syncDevice);

    return () => {
      window.removeEventListener("resize", syncDevice);
      window.removeEventListener("orientationchange", syncDevice);
    };
  }, [setDevice]);

  return null;
}
