import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getAuthSession } from "@/lib/auth-session";
import {
  isAssistedE2EHarnessEnabledV1,
  runAssistedGenerationComparisonV1,
  toAssistedComparisonArtifactV1,
} from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { ASSISTED_COMPARISON_ARTIFACT_PATH_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/artifact-path";

/**
 * ASSISTED-4A: DEV/E2E-ONLY trigger for the NovaMarket OFF vs ANTHROPIC
 * comparison. Not executed in ASSISTED-4A.
 *
 * - Build-time: the `.dev.ts` extension is only a route extension outside
 *   production (next.config.ts pageExtensions), so `next build` never
 *   includes this route in the production manifest.
 * - 404 unless NODE_ENV !== "production" AND ORVENIX_DEV_ASSISTED_E2E=1.
 * - Requires a signed-in session (JWT-only, no DB read).
 * - POST only; the request body/query are NEVER read -- no browser input
 *   can choose a mode, provider, business or fixture.
 * - One-shot: refuses (409) if the artifact already exists, so each run
 *   is at most ONE real Anthropic call. Delete the artifact to rerun.
 * - Writes only the local gitignored artifact (.tmp/), never the DB.
 * - Returns only lifecycle status/fingerprints -- never credentials,
 *   raw provider output, or the trees themselves.
 */

export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

export async function GET() {
  return notFound();
}

export async function POST() {
  const env = { NODE_ENV: process.env.NODE_ENV, ORVENIX_DEV_ASSISTED_E2E: process.env.ORVENIX_DEV_ASSISTED_E2E };
  if (!isAssistedE2EHarnessEnabledV1(env)) return notFound();

  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const alreadyExists = await fs
    .access(ASSISTED_COMPARISON_ARTIFACT_PATH_V1)
    .then(() => true)
    .catch(() => false);
  if (alreadyExists) return NextResponse.json({ error: "ARTIFACT_EXISTS" }, { status: 409 });

  const result = await runAssistedGenerationComparisonV1({ env });
  const artifact = toAssistedComparisonArtifactV1(result);

  await fs.mkdir(path.dirname(ASSISTED_COMPARISON_ARTIFACT_PATH_V1), { recursive: true });
  await fs.writeFile(ASSISTED_COMPARISON_ARTIFACT_PATH_V1, JSON.stringify(artifact), "utf8");

  const summarize = (lifecycle: typeof artifact.off.lifecycle) =>
    lifecycle.status === "disabled"
      ? { status: lifecycle.status }
      : {
          status: lifecycle.status,
          providerKey: lifecycle.providerKey,
          modelKey: lifecycle.modelKey,
          ...("inputFingerprint" in lifecycle ? { inputFingerprint: lifecycle.inputFingerprint } : {}),
          ...("outputFingerprint" in lifecycle ? { outputFingerprint: lifecycle.outputFingerprint } : {}),
          ...("reasons" in lifecycle ? { reasons: lifecycle.reasons } : {}),
        };

  return NextResponse.json({
    ok: true,
    off: { planHash: artifact.off.planHash, lifecycle: summarize(artifact.off.lifecycle) },
    assisted: { planHash: artifact.assisted.planHash, lifecycle: summarize(artifact.assisted.lifecycle) },
    view: "/dev-assisted-generation-e2e/view/off/home",
  });
}
