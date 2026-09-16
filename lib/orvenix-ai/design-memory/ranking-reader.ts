import { editorPrisma } from "@/lib/editor-db";

import {
  rankDesignPatternsV1,
  type DesignPatternRankingV1,
  type DesignPatternRankingV1Level,
  type DesignRankingInputV1,
} from "./design-ranking";
import { DESIGN_PATTERN_V1_VERSION } from "./design-pattern";

export type GetDesignPatternRankingV1Input = {
  level: DesignPatternRankingV1Level;
  limit?: number;
};

export type GetDesignPatternRankingV1Result =
  | {
      ok: true;
      rankings: DesignPatternRankingV1[];
    }
  | {
      ok: false;
      rankings: [];
      error: string;
    };

type DesignRankingRow = {
  patternVersion: number | null;
  patternKey: unknown;
  outcomeVersion: number | null;
  outcomeScore: number | null;
  status: string;
  editDistance: number | null;
  createdAt: Date;
  outcomeQualifiedAt: Date | null;
};

interface DesignPatternRankingReaderClient {
  designGeneration: {
    findMany: (args: {
      where: {
        patternVersion: typeof DESIGN_PATTERN_V1_VERSION;
      };
      select: {
        patternVersion: true;
        patternKey: true;
        outcomeVersion: true;
        outcomeScore: true;
        status: true;
        editDistance: true;
        createdAt: true;
        outcomeQualifiedAt: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    }) => Promise<DesignRankingRow[]>;
  };
}

function normalizeLimit(value: number | undefined) {
  if (value === undefined) return null;
  if (!Number.isInteger(value) || value <= 0) return null;
  return Math.min(value, 500);
}

function toRankingInput(row: DesignRankingRow): DesignRankingInputV1 {
  return {
    patternVersion: row.patternVersion,
    patternKey: row.patternKey,
    outcomeVersion: row.outcomeVersion,
    outcomeScore: row.outcomeScore,
    status: row.status,
    editDistance: row.editDistance,
    createdAt: row.createdAt,
    outcomeQualifiedAt: row.outcomeQualifiedAt,
  };
}

export async function getDesignPatternRankingV1(
  input: GetDesignPatternRankingV1Input,
  client: DesignPatternRankingReaderClient = editorPrisma,
): Promise<GetDesignPatternRankingV1Result> {
  try {
    if (input.level !== "L1" && input.level !== "L2") {
      return {
        ok: false,
        rankings: [],
        error: "No se pudo leer el ranking de patrones de diseño.",
      };
    }

    const rows = await client.designGeneration.findMany({
      where: {
        patternVersion: DESIGN_PATTERN_V1_VERSION,
      },
      select: {
        patternVersion: true,
        patternKey: true,
        outcomeVersion: true,
        outcomeScore: true,
        status: true,
        editDistance: true,
        createdAt: true,
        outcomeQualifiedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const rankings = rankDesignPatternsV1(rows.map(toRankingInput), input.level);
    const limit = normalizeLimit(input.limit);

    return {
      ok: true,
      rankings: limit === null ? rankings : rankings.slice(0, limit),
    };
  } catch (error) {
    console.error("[Orvenix Design Memory] No se pudo leer el ranking de patrones:", error);

    return {
      ok: false,
      rankings: [],
      error: "No se pudo leer el ranking de patrones de diseño.",
    };
  }
}
