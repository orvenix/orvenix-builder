import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/editor-prisma";
import { getResolvedSitePage, getResolvedSiteTheme, listSitePages } from "@/lib/builder-core/tree/sitePages";
import { editorPrisma } from "@/lib/editor-db";

import {
  DESIGN_PATTERN_V1_VERSION,
  extractDesignPatternV1,
} from "./design-pattern";
import {
  computeDesignOutcomeV1,
} from "./design-outcome";
import { measureDesignGenerationDrift, type DesignGenerationEditMetrics } from "./edit-metrics";
import { validateSiteCreationPlanV2, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS } from "@/lib/orvenix-ai/site-creation/plan-v2";
import { validateTree } from "@/types/validateTree";

import type {
  AcceptDesignGenerationInput,
  AcceptDesignGenerationResult,
  MarkDesignGenerationEditedInput,
  MarkDesignGenerationEditedResult,
  MarkDesignGenerationPublishedInput,
  MarkDesignGenerationPublishedResult,
  MeasureDesignGenerationEditMetricsInput,
  MeasureDesignGenerationEditMetricsResult,
  RecordDesignGenerationInput,
  RecordDesignGenerationResult,
  RefreshDesignGenerationOutcomeInput,
  RefreshDesignGenerationOutcomeResult,
} from "./types";

type MutableDesignGenerationStatus = "generated" | "accepted" | "edited" | "published" | "abandoned";

interface RecordDesignGenerationClient {
  designGeneration: {
    upsert: (args: {
      where: { id: string };
      create: {
        id: string;
        userId: string;
        request: string;
        industry?: string;
        siteType?: string;
        objective?: string;
        requestedStyle?: string;
        initialPlan: Prisma.InputJsonValue;
        initialPlanHash: string;
        siteCreationAttemptId?: string;
        status: "generated";
        patternVersion?: number;
        patternHash?: string;
        patternKey?: Prisma.InputJsonValue;
      };
      update: {
        initialPlanHash: string;
        siteCreationAttemptId?: string;
      };
      select: { id: true };
    }) => Promise<{ id: string }>;
    updateMany?: (args: {
      where: {
        id: string;
        patternVersion: null;
      };
      data: {
        patternVersion?: number;
        patternHash?: string;
        patternKey?: Prisma.InputJsonValue;
      };
    }) => Promise<{ count: number }>;
  };
}

interface AcceptDesignGenerationTxClient {
  designGeneration: {
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        userId: true;
        initialPlanHash: true;
        status: true;
        siteId: true;
        editDistance?: true;
        createdAt?: true;
      };
    }) => Promise<{
      id: string;
      userId: string;
      initialPlanHash: string;
      status: string;
      siteId: string | null;
      editDistance?: number | null;
      createdAt?: Date;
    } | null>;
    updateMany: (args: {
      where: {
        id: string;
        userId: string;
        initialPlanHash: string;
        status?: { in: MutableDesignGenerationStatus[] };
      };
      data: {
        siteId: string;
        status?: "accepted";
        outcomeVersion?: number;
        outcomeScore?: number | null;
        outcomeQualifiedAt?: Date | null;
      };
    }) => Promise<{ count: number }>;
  };
  editorWebsite: {
    updateMany: (args: {
      where: { id: string };
      data: { activeDesignGenerationId: string };
    }) => Promise<{ count: number }>;
  };
}

interface AcceptDesignGenerationClient extends AcceptDesignGenerationTxClient {
  $transaction?: <T>(fn: (tx: AcceptDesignGenerationTxClient) => Promise<T>) => Promise<T>;
}

interface ActiveDesignGenerationClient {
  editorWebsite: {
    findUnique: (args: {
      where: { id: string };
      select: { activeDesignGenerationId: true };
    }) => Promise<{ activeDesignGenerationId: string | null } | null>;
  };
  designGeneration: {
    updateMany: (args: {
      where: {
        id: string;
        siteId: string;
        status: { in: MutableDesignGenerationStatus[] };
      };
      data: {
        status: "edited" | "published";
        outcomeVersion?: number;
        outcomeScore?: number | null;
        outcomeQualifiedAt?: Date | null;
      };
    }) => Promise<{ count: number }>;
  };
}

interface MeasureDesignGenerationMetricsClient {
  editorWebsite: {
    findUnique: (args: {
      where: { id: string };
      select: { activeDesignGenerationId: true };
    }) => Promise<{ activeDesignGenerationId: string | null } | null>;
  };
  designGeneration: {
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        siteId: true;
        initialPlan: true;
      };
    }) => Promise<{ id: string; siteId: string | null; initialPlan: unknown } | null>;
    updateMany: (args: {
      where: {
        id: string;
        siteId: string;
      };
      data: {
        editMetrics: Prisma.InputJsonValue;
        editDistance: number;
        measuredAt: Date;
      };
    }) => Promise<{ count: number }>;
  };
}

interface RefreshDesignGenerationOutcomeClient {
  editorWebsite: {
    findUnique: (args: {
      where: { id: string };
      select: { activeDesignGenerationId: true };
    }) => Promise<{ activeDesignGenerationId: string | null } | null>;
  };
  designGeneration: {
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        siteId: true;
        status: true;
        editDistance: true;
        createdAt: true;
      };
    }) => Promise<{
      id: string;
      siteId: string | null;
      status: string;
      editDistance: number | null;
      createdAt: Date;
    } | null>;
    updateMany: (args: {
      where: {
        id: string;
        siteId: string;
      };
      data: {
        outcomeVersion: number;
        outcomeScore: number | null;
        outcomeQualifiedAt: Date | null;
      };
    }) => Promise<{ count: number }>;
  };
}

function cleanOptional(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return cleaned || undefined;
}

function cleanRequired(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanSiteId(value: string) {
  const cleaned = value.trim().slice(0, 64);
  return /^[A-Za-z0-9:_-]{1,64}$/.test(cleaned) ? cleaned : "";
}

function outcomeData(params: {
  status: string;
  editDistance?: number | null;
  createdAt?: Date;
  now?: Date;
}) {
  const outcome = computeDesignOutcomeV1({
    status: params.status,
    editDistance: params.editDistance,
    createdAt: params.createdAt ?? new Date(),
    now: params.now,
  });

  return {
    outcomeVersion: outcome.version,
    outcomeScore: outcome.outcomeScore,
    outcomeQualifiedAt: outcome.qualifiedAt,
  };
}

function patternData(input: RecordDesignGenerationInput): {
  patternVersion?: number;
  patternHash?: string;
  patternKey?: Prisma.InputJsonValue;
} {
  try {
    const extracted = extractDesignPatternV1({
      initialPlan: input.initialPlan,
      industry: input.industry,
      siteType: input.siteType,
      objective: input.objective,
      requestedStyle: input.requestedStyle,
    });

    return {
      patternVersion: DESIGN_PATTERN_V1_VERSION,
      patternHash: extracted.patternHash,
      patternKey: JSON.parse(JSON.stringify(extracted.pattern)) as Prisma.InputJsonValue,
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo extraer Pattern V1:",
      error,
    );

    return {};
  }
}

export function createDesignGenerationId(
  input: Pick<RecordDesignGenerationInput, "userId" | "request" | "initialPlanHash">,
) {
  const digest = createHash("sha256")
    .update(input.userId)
    .update("\0")
    .update(cleanRequired(input.request, 4000))
    .update("\0")
    .update(input.initialPlanHash)
    .digest("hex");

  return `design_generation:${digest}`;
}

export async function recordDesignGeneration(
  input: RecordDesignGenerationInput,
  client: RecordDesignGenerationClient = editorPrisma,
): Promise<RecordDesignGenerationResult> {
  try {
    const request = cleanRequired(input.request, 4000);

    if (!input.userId || !request || !/^[a-f0-9]{64}$/.test(input.initialPlanHash)) {
      return {
        ok: false,
        error: "No se pudo registrar la memoria de diseño.",
      };
    }

    const id = createDesignGenerationId({
      userId: input.userId,
      request,
      initialPlanHash: input.initialPlanHash,
    });
    const pattern = patternData(input);
    const siteCreationAttemptId = cleanOptional(input.siteCreationAttemptId, 191);

    const generation = await client.designGeneration.upsert({
      where: { id },
      create: {
        id,
        userId: input.userId,
        request,
        industry: cleanOptional(input.industry, 191),
        siteType: cleanOptional(input.siteType, 64),
        objective: cleanOptional(input.objective, 512),
        requestedStyle: cleanOptional(input.requestedStyle, 191),
        initialPlan: input.initialPlan as unknown as Prisma.InputJsonValue,
        initialPlanHash: input.initialPlanHash,
        ...(siteCreationAttemptId ? { siteCreationAttemptId } : {}),
        status: "generated",
        ...pattern,
      },
      update: {
        initialPlanHash: input.initialPlanHash,
        ...(siteCreationAttemptId ? { siteCreationAttemptId } : {}),
      },
      select: {
        id: true,
      },
    });

    if (pattern.patternVersion === DESIGN_PATTERN_V1_VERSION && typeof client.designGeneration.updateMany === "function") {
      try {
        await client.designGeneration.updateMany({
          where: {
            id,
            patternVersion: null,
          },
          data: pattern,
        });
      } catch (error) {
        console.error("Design Memory pattern backfill failed", error);
      }
    }

    return {
      ok: true,
      generationId: generation.id,
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo registrar la generacion:",
      error,
    );

    return {
      ok: false,
      error: "No se pudo registrar la memoria de diseño.",
    };
  }
}

async function acceptDesignGenerationInClient(
  input: AcceptDesignGenerationInput & { id: string },
  client: AcceptDesignGenerationTxClient,
): Promise<AcceptDesignGenerationResult> {
  const generation = await client.designGeneration.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      userId: true,
      initialPlanHash: true,
      status: true,
      siteId: true,
      editDistance: true,
      createdAt: true,
    },
  });

  if (
    !generation ||
    generation.userId !== input.userId ||
    generation.initialPlanHash !== input.initialPlanHash ||
    generation.status === "abandoned"
  ) {
    return {
      ok: false,
      error: "No se encontró la memoria de diseño generada.",
    };
  }

  if (generation.status === "generated" || generation.status === "accepted") {
    const accepted = await client.designGeneration.updateMany({
      where: {
        id: input.id,
        userId: input.userId,
        initialPlanHash: input.initialPlanHash,
        status: { in: ["generated", "accepted"] },
      },
      data: {
        siteId: input.siteId,
        status: "accepted",
        ...outcomeData({
          status: "accepted",
          editDistance: generation.editDistance,
          createdAt: generation.createdAt,
        }),
      },
    });

    if (accepted.count === 0) {
      return {
        ok: false,
        error: "No se encontró la memoria de diseño generada.",
      };
    }
  } else if (generation.status === "edited" || generation.status === "published") {
    const linked = await client.designGeneration.updateMany({
      where: {
        id: input.id,
        userId: input.userId,
        initialPlanHash: input.initialPlanHash,
        status: { in: ["edited", "published"] },
      },
      data: {
        siteId: input.siteId,
      },
    });

    if (linked.count === 0) {
      return {
        ok: false,
        error: "No se pudo confirmar la memoria de diseño activa.",
      };
    }
  } else {
    return {
      ok: false,
      error: "No se encontró la memoria de diseño generada.",
    };
  }

  const site = await client.editorWebsite.updateMany({
    where: { id: input.siteId },
    data: { activeDesignGenerationId: input.id },
  });

  if (site.count === 0) {
    return {
      ok: false,
      error: "No se pudo asociar la memoria de diseño activa al sitio.",
    };
  }

  return {
    ok: true,
    generationId: input.id,
    siteId: input.siteId,
    status: "accepted",
  };
}

export async function acceptDesignGeneration(
  input: AcceptDesignGenerationInput,
  client: AcceptDesignGenerationClient = editorPrisma,
): Promise<AcceptDesignGenerationResult> {
  try {
    const request = cleanRequired(input.request, 4000);
    const siteId = cleanSiteId(input.siteId);

    if (
      !input.userId ||
      !request ||
      !siteId ||
      !/^[a-f0-9]{64}$/.test(input.initialPlanHash)
    ) {
      return {
        ok: false,
        error: "No se pudo aceptar la memoria de diseño.",
      };
    }

    const id = createDesignGenerationId({
      userId: input.userId,
      request,
      initialPlanHash: input.initialPlanHash,
    });

    const acceptedInput = {
      ...input,
      request,
      siteId,
      id,
    };

    if (typeof client.$transaction === "function") {
      return await client.$transaction((tx) => acceptDesignGenerationInClient(acceptedInput, tx));
    }

    return await acceptDesignGenerationInClient(acceptedInput, client);
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo aceptar la generacion:",
      error,
    );

    return {
      ok: false,
      error: "No se pudo aceptar la memoria de diseño.",
    };
  }
}

async function resolveActiveDesignGenerationId(siteId: string, client: Pick<ActiveDesignGenerationClient, "editorWebsite">) {
  const site = await client.editorWebsite.findUnique({
    where: { id: siteId },
    select: { activeDesignGenerationId: true },
  });

  return site?.activeDesignGenerationId ?? null;
}

export async function markDesignGenerationEdited(
  input: MarkDesignGenerationEditedInput,
  client: ActiveDesignGenerationClient = editorPrisma,
): Promise<MarkDesignGenerationEditedResult> {
  try {
    const siteId = cleanSiteId(input.siteId);

    if (!siteId) {
      return {
        ok: false,
        error: "No se pudo marcar la memoria de diseño como editada.",
      };
    }

    const activeDesignGenerationId = await resolveActiveDesignGenerationId(siteId, client);

    if (!activeDesignGenerationId) {
      return {
        ok: false,
        siteId,
        updatedCount: 0,
        error: "El sitio no tiene una memoria de diseño activa.",
      };
    }

    const result = await client.designGeneration.updateMany({
      where: {
        id: activeDesignGenerationId,
        siteId,
        status: { in: ["accepted", "edited"] },
      },
      data: {
        status: "edited",
        ...outcomeData({
          status: "edited",
        }),
      },
    });

    if (result.count === 0) {
      return {
        ok: false,
        siteId,
        updatedCount: 0,
        error: "No se encontró una memoria de diseño activa aceptada para editar.",
      };
    }

    return {
      ok: true,
      siteId,
      status: "edited",
      updatedCount: result.count,
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo marcar la generacion como editada:",
      error,
    );

    return {
      ok: false,
      error: "No se pudo marcar la memoria de diseño como editada.",
    };
  }
}

export async function markDesignGenerationPublished(
  input: MarkDesignGenerationPublishedInput,
  client: ActiveDesignGenerationClient = editorPrisma,
): Promise<MarkDesignGenerationPublishedResult> {
  try {
    const siteId = cleanSiteId(input.siteId);

    if (!siteId) {
      return {
        ok: false,
        error: "No se pudo marcar la memoria de diseño como publicada.",
      };
    }

    const activeDesignGenerationId = await resolveActiveDesignGenerationId(siteId, client);

    if (!activeDesignGenerationId) {
      return {
        ok: false,
        siteId,
        updatedCount: 0,
        error: "El sitio no tiene una memoria de diseño activa.",
      };
    }

    const result = await client.designGeneration.updateMany({
      where: {
        id: activeDesignGenerationId,
        siteId,
        status: { in: ["accepted", "edited", "published"] },
      },
      data: {
        status: "published",
        ...outcomeData({
          status: "published",
        }),
      },
    });

    if (result.count === 0) {
      return {
        ok: false,
        siteId,
        updatedCount: 0,
        error: "No se encontró una memoria de diseño activa aceptada o editada para publicar.",
      };
    }

    return {
      ok: true,
      siteId,
      status: "published",
      updatedCount: result.count,
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo marcar la generacion como publicada:",
      error,
    );

    return {
      ok: false,
      error: "No se pudo marcar la memoria de diseño como publicada.",
    };
  }
}
export async function refreshDesignGenerationOutcome(
  input: RefreshDesignGenerationOutcomeInput,
  client: RefreshDesignGenerationOutcomeClient = editorPrisma,
): Promise<RefreshDesignGenerationOutcomeResult> {
  try {
    const siteId = cleanSiteId(input.siteId);

    if (!siteId) {
      return {
        ok: false,
        error: "No se pudo actualizar el resultado estadistico de diseño.",
      };
    }

    const activeDesignGenerationId = await resolveActiveDesignGenerationId(siteId, client);

    if (!activeDesignGenerationId) {
      return {
        ok: false,
        siteId,
        error: "El sitio no tiene una memoria de diseño activa.",
      };
    }

    const generation = await client.designGeneration.findUnique({
      where: { id: activeDesignGenerationId },
      select: {
        id: true,
        siteId: true,
        status: true,
        editDistance: true,
        createdAt: true,
      },
    });

    if (!generation || generation.siteId !== siteId) {
      return {
        ok: false,
        siteId,
        generationId: activeDesignGenerationId,
        error: "No se encontro la memoria de diseño activa asociada al sitio.",
      };
    }

    const data = outcomeData({
      status: generation.status,
      editDistance: generation.editDistance,
      createdAt: generation.createdAt,
      now: input.now,
    });

    const saved = await client.designGeneration.updateMany({
      where: {
        id: generation.id,
        siteId,
      },
      data,
    });

    if (saved.count === 0) {
      return {
        ok: false,
        siteId,
        generationId: generation.id,
        error: "No se pudo guardar el resultado estadistico de diseño.",
      };
    }

    return {
      ok: true,
      siteId,
      generationId: generation.id,
      outcomeVersion: data.outcomeVersion,
      outcomeScore: data.outcomeScore,
      outcomeQualifiedAt: data.outcomeQualifiedAt?.toISOString() ?? null,
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo actualizar el resultado estadistico:",
      error,
    );

    return {
      ok: false,
      error: "No se pudo actualizar el resultado estadistico de diseño.",
    };
  }
}

async function readCurrentPersistedSiteForMetrics(siteId: string) {
  const pageItems = await listSitePages(siteId);
  const pages = [];

  for (const item of pageItems) {
    const page = await getResolvedSitePage(siteId, item.slug);
    if (!page) continue;

    pages.push({
      slug: page.slug,
      tree: validateTree(page.tree),
    });
  }

  const theme = await getResolvedSiteTheme(siteId);

  return {
    pages,
    theme: theme.tokens,
  };
}

function toMetricsJson(metrics: DesignGenerationEditMetrics): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(metrics)) as Prisma.InputJsonValue;
}

export async function measureAndRecordDesignGenerationEditMetrics(
  input: MeasureDesignGenerationEditMetricsInput,
  client: MeasureDesignGenerationMetricsClient = editorPrisma,
): Promise<MeasureDesignGenerationEditMetricsResult> {
  try {
    const siteId = cleanSiteId(input.siteId);

    if (!siteId) {
      return {
        ok: false,
        error: "No se pudieron medir las métricas de edición.",
      };
    }

    const activeDesignGenerationId = await resolveActiveDesignGenerationId(siteId, client);

    if (!activeDesignGenerationId) {
      return {
        ok: false,
        siteId,
        error: "El sitio no tiene una memoria de diseño activa.",
      };
    }

    const generation = await client.designGeneration.findUnique({
      where: { id: activeDesignGenerationId },
      select: {
        id: true,
        siteId: true,
        initialPlan: true,
      },
    });

    if (!generation || generation.siteId !== siteId) {
      return {
        ok: false,
        siteId,
        generationId: activeDesignGenerationId,
        error: "No se encontró la memoria de diseño activa asociada al sitio.",
      };
    }

    const validation = validateSiteCreationPlanV2(
      generation.initialPlan,
      SITE_CREATION_PLAN_V2_DEFAULT_LIMITS,
    );

    if (!validation.ok) {
      return {
        ok: false,
        siteId,
        generationId: generation.id,
        error: "La memoria de diseño no contiene un Plan V2 válido.",
      };
    }

    const currentSite = await readCurrentPersistedSiteForMetrics(siteId);
    if (currentSite.pages.length === 0) {
      return {
        ok: false,
        siteId,
        generationId: generation.id,
        error: "El sitio no tiene páginas persistidas para medir.",
      };
    }

    const metrics = measureDesignGenerationDrift(validation.plan, currentSite);
    const measuredAt = new Date();
    const saved = await client.designGeneration.updateMany({
      where: {
        id: generation.id,
        siteId,
      },
      data: {
        editMetrics: toMetricsJson(metrics),
        editDistance: metrics.editDistance,
        measuredAt,
      },
    });

    if (saved.count === 0) {
      return {
        ok: false,
        siteId,
        generationId: generation.id,
        error: "No se pudieron guardar las métricas de edición.",
      };
    }

    return {
      ok: true,
      siteId,
      generationId: generation.id,
      metrics,
      editDistance: metrics.editDistance,
      measuredAt: measuredAt.toISOString(),
    };
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudieron medir las metricas de edicion:",
      error,
    );

    return {
      ok: false,
      error: "No se pudieron medir las métricas de edición.",
    };
  }
}
