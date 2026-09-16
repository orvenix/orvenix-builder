# Orvenix AI Generation Evaluation Harness V1

Deterministic, structural quality evaluation for `SiteCreationPlanV2`
artifacts. Used to catch regressions as the AI Builder evolves.

## What it measures

Six dimensions, each producing findings and a 0..100 score:

- **structure** — graph integrity `validateSiteCreationPlanV2` doesn't check:
  dangling `children` references, node-graph cycles, unreachable nodes, and
  a completely empty home page.
- **completeness** — objectively empty or very thin pages (no assumption of
  a universal page inventory; no "every site needs a FAQ").
- **navigation** — internal `page:<slug>` links embedded in node props that
  point nowhere, and pages unreachable from top-level nav or content links.
- **content** — empty text fields, lorem ipsum, obvious placeholder markers,
  excessive verbatim duplication, pages with no heading node.
- **designConsistency** — objective theme/token checks: empty theme,
  missing color channels, text/background color collision, out-of-range
  numeric props (opacity, negative width/height).
- **conversionReadiness** — only runs when the caller passes
  `context.objective` (Plan V2 itself carries no objective/siteType).
  Recognizes two buckets: "leads/appointments" (requires a real CTA) and
  "informational" (no requirement). Anything else abstains.

## What it does NOT measure

No LLM judge, no network, no provider calls, no screenshots/visual
rendering, no subjective aesthetic judgment (color harmony, persuasiveness,
tone), no ecommerce/checkout assumptions unless the objective says so.

## Scoring

Each dimension's score starts at 100 and subtracts a fixed penalty per
finding severity (`error: 25`, `warning: 8`, `info: 0`), floored at 0. The
overall score is a weighted average of applicable dimensions:
`structure 30, completeness 20, navigation 15, content 15,
designConsistency 10, conversionReadiness 10` (sums to 100; see
`scoring.ts`). An abstaining dimension (e.g. conversionReadiness with no
context) is excluded and the remaining weights are renormalized, so the
overall score always stays within 0..100. Same plan + same context always
produce the exact same result — no randomness, no clocks, no I/O.

## Hard failures

Two codes force `passed = false` regardless of the computed score
(see `codes.ts`):

- `STRUCTURE_PLAN_INVALID` — the plan fails `validateSiteCreationPlanV2`
  itself (covers "no home", "duplicate slug", and any other contract
  violation). The whole evaluation short-circuits: score is forced to 0
  and every dimension but `structure` abstains, since nothing else can be
  meaningfully evaluated on a malformed artifact.
- `STRUCTURE_HOME_EMPTY` — the plan is contract-valid but the home page has
  zero real content. Other dimensions still run normally; only `passed` is
  forced false.

Absent a hard failure, `passed = score >= EVALUATION_PASS_THRESHOLD` (60).

## Findings

Every finding has `code`, `severity` (`error | warning | info`),
`dimension`, and `message`, plus optional `pageSlug`/`nodeId` locators.
Messages are template strings referencing only structural identifiers
(slugs, ids, counts) — never raw business copy — to keep findings safe to
log or display.

## Determinism

No `Date.now()`, no `Math.random()`, no network, no filesystem, no DB.
Object/array iteration order is fixed by the plan's own canonical JSON
(`validateSiteCreationPlanV2` returns keys sorted alphabetically) and by
fixed-order allowlists (`CONTENT_PROP_KEYS`, dimension weight tables). The
input plan is never mutated: `evaluateSiteCreationPlanV2` works off the
freshly parsed `result.plan` returned by validation, not the caller's
object.

## Fixtures & corpus

`fixtures.ts` exports a small factory (`buildFixtureTheme`, page/tree
builders) and 11 named, private-data-free fixtures covering: a good
service-business site, a good informational site, a minimal valid site,
broken navigation (dead internal link + orphaned page), an empty non-home
page, an empty home page (hard failure), placeholder/duplicate content, a
contract-invalid plan, a dangling child reference, a node cycle, and design
inconsistencies. `SITE_GENERATION_EVALUATION_CORPUS_V1` bundles them for
`summarizeSiteGenerationEvaluations`, useful for diffing two Builder
versions over the same corpus later.

## Read-only / decoupled by design

This harness never writes to the DB (no `DesignGeneration`,
`Outcome`, or `Ranking` mutation) and never imports the Assistance
lifecycle/orchestrator/provider or the autonomous builder — it works from a
`SiteCreationPlanV2` value alone and functions whether or not those
modules exist.

## Known V1 limitations (by design, not oversight)

- `conversionReadiness` only understands two objective buckets today
  (leads/appointments, informational); anything else abstains rather than
  guessing.
- Content-string scanning only looks at an explicit allowlist of prop keys
  (`text`, `content`, `label`, `title`, ...); unknown text-bearing props on
  future block types won't be scanned until added to the allowlist.
- CTA detection matches on `node.type` containing `"cta"` (case-insensitive)
  plus a plain `href` prop or an internal `page:` link anywhere in props.
- No visual/rendered evaluation, no LLM judge, no outcome correlation, no
  A/B or provider comparison — planned as separate, additive evaluators
  layered on top of this same `SiteGenerationEvaluationV1` contract later.
