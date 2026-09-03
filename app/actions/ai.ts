'use server';

import Anthropic from "@anthropic-ai/sdk";
import type { EditorTree } from "@/types/editor";
import { validateTree } from "@/types/validateTree";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth-session";
import { requireAIPlan, requireCanCreateWebsite } from "@/lib/plan-guard";
import { extractFirstJsonObject, normalizeGeneratedTreeCandidate } from "@/lib/ai/generationSchema";
import { runAIGenerationJob } from "@/lib/ai/jobs";
import { buildAuditFixPlan } from "@/lib/audit/fixPlan";
import {
  buildArtisanInspiredFallbackTree,
  buildArtisanSectionReferenceContext,
} from "@/lib/orvenix-ai/section/artisan-section-references";
import {
  buildSiteGenerationGuideContext,
} from "@/lib/orvenix-ai/guidelines/site-generation-guidelines";

import {
  canManageSite,
  type UserRole,
} from "@/lib/auth";

import {
  hashEditorTree,
  runOrvenixAgent,
  type OrvenixAgentMode,
  type OrvenixAgentResponse,
} from "@/lib/orvenix-ai";

import {
  createSitePublicationCapability,
} from "@/lib/site-publication";

import {
  getEditorTreeFromDb,
} from "@/lib/editorPersistence";

import {
  createDraftSiteFromPersistedPreview,
  getSiteCreationPreviewFailureMessage,
  getSiteCreationPreviewForExecute,
  rememberSiteCreationPreview,
} from "@/lib/orvenix-ai/site-creation/preview-store";
import {
  registerAIUndoForExecutedResult,
  rollbackOrvenixAIChange,
} from "@/lib/orvenix-ai/mutation/undo-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BlockContext = {
  type: string;
  label: string;
  description: string;
  category: string;
};

export interface AIGenerationContext {
  siteId?: string | null;
  pageSlug?: string | null;
  source?: string;
  skipJobLogging?: boolean;
}

type SectionIntent = "hero" | "services" | "pricing" | "contact" | "testimonials";

type GeneratedSection = {
  success: true;
  tree: EditorTree;
  title: string;
  message: string;
  usedAI: boolean;
};

type GenerationError = {
  success: false;
  message: string;
};

type AuditFixResult =
  | {
      success: true;
      message: string;
      issueIds: string[];
      seoPatch: Record<string, unknown>;
      nodePatches: Array<{
        issueId: string;
        domain: "seo" | "wcag" | "performance";
        nodeId: string;
        patch: Record<string, unknown>;
      }>;
    }
  | GenerationError;

type CopyEditResult =
  | {
      success: true;
      message: string;
      props: Record<string, unknown>;
      usedAI: boolean;
    }
  | GenerationError;

async function requireAIActionAccess(): Promise<string | null> {
  const session = await getAuthSession();
  if (!session?.user?.id) return "Inicia sesión para usar Orvenix AI.";

  try {
    await requireAIPlan(session.user.id);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Actualiza tu plan para acceder a Orvenix AI. Ve a /precios.";
  }
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

function detectIntent(prompt: string): SectionIntent {
  const text = prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/(precio|pricing|plan|planes|paquete|paquetes|mensual|suscripcion|pago|comprar|producto)/.test(text)) return "pricing";
  if (/(testimonio|testimonial|caso de exito|prueba social|resena|review|opinion|cliente feliz)/.test(text)) return "testimonials";
  if (/(contact|whatsapp|formulario|agenda|agendar|llamada|demo|ubicacion|telefono|correo)/.test(text)) return "contact";
  if (/(servicio|servicios|beneficio|feature|caracteristica|solucion|especialidad|areas|categoria)/.test(text)) return "services";
  return "hero";
}

function pickAvailableType(blocks: BlockContext[], preferredTypes: string[]): string | null {
  const available = new Set(blocks.map((block) => block.type));
  return preferredTypes.find((type) => available.has(type)) ?? null;
}

function buildFewShotExamples(blocks: BlockContext[], prompt: string): string {
  const examples: string[] = [];
  const intent = detectIntent(prompt);
  const artisanReferenceContext = buildArtisanSectionReferenceContext(prompt, intent);

  const completeExamples = [
    {
      label: "hero premium para agencia",
      type: pickAvailableType(blocks, ["agency-hero", "landing-hero", "modular-hero"]),
    },
    {
      label: "servicios o capacidades",
      type: pickAvailableType(blocks, ["agency-services", "landing-features", "devops-services"]),
    },
    {
      label: "testimonios o prueba social",
      type: pickAvailableType(blocks, ["agency-testimonials", "landing-testimonials"]),
    },
    {
      label: "pricing o planes",
      type: pickAvailableType(blocks, ["landing-pricing-real", "saas-pricing"]),
    },
    {
      label: "contacto o CTA final",
      type: pickAvailableType(blocks, ["agency-cta", "modular-contact-form"]),
    },
  ];

  completeExamples.forEach((example, index) => {
    if (!example.type) return;
    examples.push(
      `EJEMPLO ${index + 1} — "${example.label}"\n` +
      `{"rootId":"ex${index + 1}","nodes":{"ex${index + 1}":{"id":"ex${index + 1}","type":"${example.type}","props":{},"children":[],"version":1}}}`
    );
  });

  if (intent === "testimonials") {
    examples.push(
      `EJEMPLO ${examples.length + 1} — "testimonios personalizados"\n` +
      '{"rootId":"custom-testimonials","nodes":{"custom-testimonials":{"id":"custom-testimonials","type":"section","props":{"paddingY":"xl","paddingX":"md","align":"center","background":"#ffffff","maxWidth":"lg"},"children":["custom-badge","custom-title","custom-copy","custom-cta"],"version":1},"custom-badge":{"id":"custom-badge","type":"text","props":{"content":"Clientes satisfechos","size":"sm","align":"center","color":"#64748b"},"children":[],"version":1},"custom-title":{"id":"custom-title","type":"heading","props":{"text":"La confianza tambien se disena","level":2,"size":"4xl","weight":"extrabold","align":"center","color":"#0f172a"},"children":[],"version":1},"custom-copy":{"id":"custom-copy","type":"text","props":{"content":"Resume resultados, credibilidad y la experiencia que respalda tu propuesta de valor.","size":"lg","align":"center","color":"#475569","maxWidth":"md"},"children":[],"version":1},"custom-cta":{"id":"custom-cta","type":"ctaButton","props":{"label":"Solicitar propuesta","href":"#","variant":"primary"},"children":[],"version":1}}}'
    );
  }

  if (!examples.some((example) => example.includes('"type":"section"'))) {
    examples.push(
      `EJEMPLO ${examples.length + 1} — "seccion personalizada"\n` +
      '{"rootId":"custom-section","nodes":{"custom-section":{"id":"custom-section","type":"section","props":{"paddingY":"xl","paddingX":"md","align":"center","background":"#0f172a","maxWidth":"lg"},"children":["custom-heading","custom-text","custom-cta"],"version":1},"custom-heading":{"id":"custom-heading","type":"heading","props":{"text":"Potencia tu negocio digital","level":2,"size":"5xl","weight":"extrabold","align":"center","color":"#ffffff"},"children":[],"version":1},"custom-text":{"id":"custom-text","type":"text","props":{"content":"Herramientas de diseno profesional para proyectos que quieren verse claros, modernos y confiables.","size":"lg","align":"center","color":"#94a3b8","maxWidth":"md"},"children":[],"version":1},"custom-cta":{"id":"custom-cta","type":"ctaButton","props":{"label":"Empezar ahora","href":"#","variant":"primary"},"children":[],"version":1}}}'
    );
  }

  return [artisanReferenceContext, examples.join("\n\n")].filter(Boolean).join("\n\n");
}

// ─── Orvenix AI (Claude) ──────────────────────────────────────────────────────

function buildBlockList(blocks: BlockContext[]): string {
  const byCategory = blocks.reduce<Record<string, BlockContext[]>>((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([cat, items]) =>
      `[${cat}]\n` +
      items.map((b) => `  ${b.type} → "${b.label}" — ${b.description}`).join("\n")
    )
    .join("\n\n");
}

async function generateWithOrveniXAI(
  prompt: string,
  blocks: BlockContext[],
  currentBlockTypes: string[]
): Promise<EditorTree | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const currentList = currentBlockTypes.length > 0
    ? currentBlockTypes.map((t, i) => `  ${i + 1}. ${t}`).join("\n")
    : "  (página vacía)";
  const allowedTypes = blocks.map((block) => block.type);
  const fewShotExamples = buildFewShotExamples(blocks, prompt);
  const generationGuide = buildSiteGenerationGuideContext({
    request: prompt,
    mode: "section",
  });

  const systemPrompt = `Eres Orvenix AI, el asistente de diseño web de Orvenix Builder.
Tu tarea: generar secciones web como árboles de bloques JSON válidos.

BLOQUES DISPONIBLES:
${buildBlockList(blocks)}

GUIA DE CREACION ORVENIX:
${generationGuide}

REGLAS:
1. Responde SOLO un objeto JSON valido con esta forma exacta:
{"rootId":"string","nodes":{"node-id":{"id":"node-id","type":"block-type","props":{},"children":[],"version":1}}}
2. No uses markdown, comentarios, fences, prose ni claves extra fuera de rootId/nodes
3. Usa SOLO tipos listados en BLOQUES DISPONIBLES
4. Bloques complejos (landing-*, crm-*, agency-*, saas-*, modular-*, pm-*): úsalos con "props": {} porque sus defaults ya están definidos
5. Para contenido personalizado usa section, heading, text, ctaButton, image con props explícitas
6. No repitas tipos ya existentes en la página salvo que el usuario lo pida
7. Mantén el árbol compacto y coherente: una raíz real, children válidos y sin nodos huérfanos
8. Si dudas entre varios bloques, prioriza el que mejor represente la intención principal del pedido
9. Usa las referencias artesanales como guía de estructura, ritmo visual, copy y paleta. No copies literalmente todo: adapta el contenido al pedido del usuario.
10. Si el pedido menciona restaurante, clínica, abogados, contabilidad, inmobiliaria o tienda, genera una sección con intención de negocio real, no una sección SaaS genérica.
11. Diseña con arquitectura de conversion: promesa, confianza, beneficio, evidencia visual, CTA y objeciones resueltas cuando aplique.
12. Todo debe quedar editable desde props; evita contenido duro que el cliente no pueda modificar.

EJEMPLOS:
${fewShotExamples}`;

  const userMessage = `PÁGINA ACTUAL (bloques existentes — no repetir salvo que se pida):
${currentList}

PEDIDO: ${prompt}

Devuelve ahora SOLO el JSON final.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : null;
    if (!raw) return null;

    const extractedJson = extractFirstJsonObject(raw);
    if (!extractedJson) return null;

    const parsed = JSON.parse(extractedJson) as unknown;
    const normalizedTree = normalizeGeneratedTreeCandidate(parsed, allowedTypes);
    if (!normalizedTree) return null;
    return validateTree(normalizedTree);
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateSectionAI(
  prompt: string,
  blocks: BlockContext[] = [],
  currentBlockTypes: string[] = [],
  context: AIGenerationContext = {}
): Promise<GeneratedSection | GenerationError> {
  const normalized = prompt.trim().replace(/\s+/g, " ").slice(0, 300);

  if (normalized.length < 8) {
    return { success: false, message: "Escribe un poco más para que Orvenix AI pueda ayudarte." };
  }

  const accessError = await requireAIActionAccess();
  if (accessError) return { success: false, message: accessError };

  const execute = async (): Promise<GeneratedSection | GenerationError> => {
    // 1. Intentar con Claude + contexto del proyecto
    if (blocks.length > 0) {
      const aiTree = await generateWithOrveniXAI(normalized, blocks, currentBlockTypes);
      if (aiTree) {
        return {
          success: true,
          tree: aiTree,
          title: normalized,
          message: "✦ Generado por Orvenix AI usando referencias artesanales de Orvenix.",
          usedAI: true,
        };
      }
    }

    // 2. Fallback: reglas + Claude solo para el copy
    const id = `orv_${Date.now().toString(36)}`;
    const intent = detectIntent(normalized);

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `${buildSiteGenerationGuideContext({ request: normalized, mode: "section" })}

Genera copy para una sección web tipo "${intent}" sobre: "${normalized}". Responde SOLO con JSON: {"title":"...","subtitle":"...","cta":"..."}`,
          }],
        });
        const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : null;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const copy = JSON.parse(jsonMatch[0]) as { title?: string; subtitle?: string; cta?: string };
            if (copy.title && copy.subtitle && copy.cta) {
              const tree = buildArtisanInspiredFallbackTree(id, normalized, intent);
              const headingNode = tree.nodes[`${id}-heading`];
              const textNode = tree.nodes[`${id}-text`];
              const ctaNode = tree.nodes[`${id}-cta`];
              if (headingNode) headingNode.props = { ...headingNode.props, text: copy.title };
              if (textNode) textNode.props = { ...textNode.props, content: copy.subtitle };
              if (ctaNode) ctaNode.props = { ...ctaNode.props, label: copy.cta };
              return { success: true, tree, title: copy.title, message: "✦ Generado por Orvenix AI.", usedAI: true };
            }
          }
        }
      } catch {
        // fall through to pure fallback
      }
    }

    return {
      success: true,
      tree: buildArtisanInspiredFallbackTree(id, normalized, intent),
      title: normalized,
      message: "Sección generada con referencias artesanales de Orvenix y lista para insertar.",
      usedAI: false,
    };
  };

  if (context.skipJobLogging) {
    return execute();
  }

  return runAIGenerationJob(
    {
      siteId: context.siteId,
      pageSlug: context.pageSlug,
      type: "section_generation",
      input: {
        prompt: normalized,
        blockCount: blocks.length,
        currentBlockTypes,
        source: context.source ?? "ai_action",
      },
    },
    execute
  );
}

function getPrimaryTextProp(type: string, props: Record<string, unknown>): string | null {
  if (type === "heading" && typeof props.text === "string") return "text";
  if (type === "text" && typeof props.content === "string") return "content";
  if (type === "ctaButton" && typeof props.label === "string") return "label";
  if (typeof props.text === "string") return "text";
  if (typeof props.content === "string") return "content";
  if (typeof props.label === "string") return "label";
  return null;
}

function fallbackCopyEdit(value: string, instruction: string): string {
  const text = value.trim();
  const intent = instruction.toLowerCase();

  if (intent.includes("corto") || intent.includes("resume") || intent.includes("breve")) {
    return text.length > 86 ? `${text.slice(0, 83).trim()}...` : text;
  }

  if (intent.includes("corporativo") || intent.includes("profesional")) {
    return text
      .replace(/\bweb\b/gi, "experiencia digital")
      .replace(/\bclientes\b/gi, "clientes estratégicos")
      .replace(/\bcrecer\b/gi, "escalar con claridad");
  }

  if (intent.includes("vendedor") || intent.includes("conversion") || intent.includes("conversión")) {
    return `${text.replace(/[.!?]+$/, "")} con resultados medibles desde el primer contacto.`;
  }

  return text.length > 0
    ? `${text.replace(/[.!?]+$/, "")}: claro, moderno y listo para convertir.`
    : "Mensaje claro, moderno y listo para convertir.";
}

export async function improveSelectedCopyAI({
  instruction,
  nodeType,
  props,
  context,
}: {
  instruction: string;
  nodeType: string;
  props: Record<string, unknown>;
  context?: AIGenerationContext;
}): Promise<CopyEditResult> {
  const accessError = await requireAIActionAccess();
  if (accessError) return { success: false, message: accessError };

  const normalized = instruction.trim().replace(/\s+/g, " ").slice(0, 240);
  const propKey = getPrimaryTextProp(nodeType, props);

  if (!propKey) {
    return {
      success: false,
      message: "Selecciona un título, texto o botón para que pueda mejorar el copy.",
    };
  }

  const currentValue = String(props[propKey] ?? "").trim();
  if (!currentValue) {
    return {
      success: false,
      message: "Ese bloque no tiene texto editable todavía.",
    };
  }

  const execute = async (): Promise<CopyEditResult> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey });
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 280,
          system:
            "Eres Orvenix AI, especialista en copywriting para interfaces SaaS enterprise. Responde solo JSON válido.",
          messages: [
            {
              role: "user",
              content: `Mejora el copy de este bloque.
Tipo de bloque: ${nodeType}
Propiedad: ${propKey}
Texto actual: ${currentValue}
Instrucción: ${normalized || "Hazlo más claro, premium y orientado a conversión."}

Responde exactamente:
{"value":"nuevo texto"}`,
            },
          ],
        });

        const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : null;
        const jsonMatch = text?.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { value?: unknown };
          if (typeof parsed.value === "string" && parsed.value.trim()) {
            return {
              success: true,
              props: { [propKey]: parsed.value.trim() },
              message: "Copy mejorado y aplicado al bloque seleccionado.",
              usedAI: true,
            };
          }
        }
      } catch {
        // fallback below
      }
    }

    return {
      success: true,
      props: { [propKey]: fallbackCopyEdit(currentValue, normalized) },
      message: "Copy mejorado con el motor local de Orvenix.",
      usedAI: false,
    };
  };

  if (context?.skipJobLogging) {
    return execute();
  }

  return runAIGenerationJob(
    {
      siteId: context?.siteId,
      pageSlug: context?.pageSlug,
      type: "copy_edit",
      input: {
        instruction: normalized,
        nodeType,
        propKey,
        source: context?.source ?? "ai_copy_edit",
      },
    },
    execute
  );
}

// ─── Full page generation ─────────────────────────────────────────────────────

export interface FullPageSection {
  prompt: string;
  result: GeneratedSection | GenerationError;
}

/**
 * Generates a complete page by calling generateSectionAI for each canonical
 * section intent. Returns results in order so the caller can insert them
 * sequentially or show a preview.
 */
export async function generateFullPageAI(
  businessDescription: string,
  blocks: BlockContext[] = [],
  context: AIGenerationContext = {}
): Promise<FullPageSection[]> {
  const accessError = await requireAIActionAccess();
  if (accessError) {
    return [{ prompt: businessDescription, result: { success: false, message: accessError } }];
  }

  const execute = async (): Promise<FullPageSection[]> => {
    const desc = businessDescription.trim().slice(0, 200);
    const intents = [
      `Hero principal para: ${desc}`,
      `Sección de servicios o características para: ${desc}`,
      `Testimonios o casos de éxito para: ${desc}`,
      `Llamada a la acción final (CTA) para: ${desc}`,
    ];

    const results: FullPageSection[] = [];
    const usedBlockTypes: string[] = [];

    for (const prompt of intents) {
      const result = await generateSectionAI(prompt, blocks, usedBlockTypes, {
        ...context,
        skipJobLogging: true,
        source: context.source ?? "full_page_generation",
      });
      results.push({ prompt, result });

      if (result.success) {
        const newTypes = Object.values(result.tree.nodes)
          .map((n) => n.type)
          .filter((t) => t !== "section");
        usedBlockTypes.push(...newTypes);
      }
    }

    return results;
  };

  if (context.skipJobLogging) {
    return execute();
  }

  return runAIGenerationJob(
    {
      siteId: context.siteId,
      pageSlug: context.pageSlug,
      type: "full_page_generation",
      input: {
        description: businessDescription.trim().slice(0, 200),
        source: context.source ?? "full_page_generation",
      },
    },
    execute
  );
}

export async function applyAuditFixesAI(
  tree: EditorTree,
  context: AIGenerationContext = {}
): Promise<AuditFixResult> {
  const accessError = await requireAIActionAccess();
  if (accessError) return { success: false, message: accessError };

  const safeTree = validateTree(tree);

  return runAIGenerationJob(
    {
      siteId: context.siteId,
      pageSlug: context.pageSlug,
      type: "audit_fix",
      input: {
        source: context.source ?? "audit_fix_panel",
        rootId: safeTree.rootId,
        nodeCount: Object.keys(safeTree.nodes).length,
      },
    },
    async () => {
      const plan = buildAuditFixPlan(safeTree);
      if (plan.issueIds.length === 0) {
        return {
          success: true,
          message: "No encontré correcciones automáticas pendientes en SEO, WCAG o performance.",
          issueIds: [],
          seoPatch: {},
          nodePatches: [],
        } satisfies AuditFixResult;
      }

      return {
        success: true,
        message: `Apliqué ${plan.issueIds.length} correcciones automáticas con trazabilidad.`,
        issueIds: plan.issueIds,
        seoPatch: plan.seoPatch,
        nodePatches: plan.nodePatches,
      } satisfies AuditFixResult;
    }
  );
}

export interface OrvenixAgentActionInput {
  siteId: string;
  pageSlug?: string;

  message: string;
  mode?: OrvenixAgentMode;

  targetNodeId?: string;
  targetSectionId?: string;

  confirmed?: boolean;

  expectedTreeHash?: string;
}

export type OrvenixAgentActionResult =
    | {
      success: true;
      result: OrvenixAgentResponse;
      previewId?: string;
      previewHash?: string;
      undo?: {
        id: string;
        siteId: string;
        pageSlug: string;
        expiresAt: string;
      };
      undoWarning?: string;
    }
  | {
      success: false;
      message: string;
    };

export interface OrvenixSiteCreationActionInput {
  message?: string;
  mode?: OrvenixAgentMode;
  confirmed?: boolean;
  previewId?: string;
  expectedPreviewHash?: string;
  business?: {
    name?: string;
    industry?: string;
    location?: string;
    objective?: string;
    description?: string;
    preferredStyle?: string;
    services?: Array<{ name: string; description?: string }>;
  };
}

export type OrvenixSiteCreationActionResult =
  | {
      success: true;
      result: OrvenixAgentResponse;
      previewId?: string;
      previewHash?: string;
      nextRoute?: string;
      siteId?: string;
    }
  | {
      success: false;
      message: string;
    };

function normalizeSiteCreationBusiness(
  input: OrvenixSiteCreationActionInput["business"] | undefined,
  message: string,
) {
  const normalizedServices = Array.isArray(input?.services)
    ? input.services
        .map((service) => ({
          name: String(service?.name ?? "").trim().slice(0, 90),
          description: String(service?.description ?? "").trim().slice(0, 180),
        }))
        .filter((service) => service.name)
        .slice(0, 8)
    : undefined;

  return {
    name: input?.name?.trim().slice(0, 120) || "Sitio creado con Orvenix AI",
    industry: input?.industry?.trim().slice(0, 90) || "negocio profesional",
    location: input?.location?.trim().slice(0, 120),
    objective: input?.objective?.trim().slice(0, 180) || "Generar prospectos y contactos",
    description: input?.description?.trim().slice(0, 600) || message,
    services: normalizedServices,
  };
}

export async function runOrvenixSiteCreationAction(
  input: OrvenixSiteCreationActionInput,
): Promise<OrvenixSiteCreationActionResult> {
  const mode = input.mode ?? "preview";
  const message = input.message?.trim().replace(/\s+/g, " ").slice(0, 1000) ?? "";
  const siteCreationRequest = `Crea un sitio desde cero. ${message}`.trim().slice(0, 1000);

  if (mode !== "execute" && !message) {
    return { success: false, message: "Describe el negocio para que Orvenix AI cree el sitio." };
  }

  const session = await getAuthSession();

  if (!session?.user?.id) {
    return { success: false, message: "Inicia sesión para crear sitios con Orvenix AI." };
  }

  if (mode !== "execute") {
    try {
      await requireAIPlan(session.user.id);
      await requireCanCreateWebsite(session.user.id);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Tu plan no permite crear otro sitio con Orvenix AI.",
      };
    }
  }

  const business = normalizeSiteCreationBusiness(input.business, message);

  try {
    if (mode === "execute") {
      if (!input.confirmed) {
        return { success: false, message: "Confirma la creación antes de guardar el sitio borrador." };
      }

      const previewId = input.previewId?.trim();
      const expectedPreviewHash = input.expectedPreviewHash?.trim().toLowerCase();

      if (!previewId || previewId.length > 80 || !expectedPreviewHash || !/^[a-f0-9]{64}$/.test(expectedPreviewHash)) {
        return { success: false, message: "La previsualización ya no es válida. Genera un Preview nuevo." };
      }

      const preview = await getSiteCreationPreviewForExecute({
        userId: session.user.id,
        previewId,
        expectedPreviewHash,
      });

      if (!preview) {
        return { success: false, message: "El Preview expiró o ya fue aplicado. Genera uno nuevo antes de crear el sitio." };
      }

      if (preview.status === "consumed" && preview.output) {
        const result: OrvenixAgentResponse = {
          ok: true,
          action: "executed",
          scope: "site_creation",
          message: "Sitio borrador recuperado. Puedes abrirlo en el editor para revisarlo antes de publicar.",
          createdSite: {
            siteId: preview.output.siteId,
            nextRoute: preview.output.nextRoute,
            verified: true,
            rollbackApplied: false,
          },
          warnings: [],
        };

        return {
          success: true,
          result,
          previewId,
          previewHash: expectedPreviewHash,
          siteId: preview.output.siteId,
          nextRoute: preview.output.nextRoute,
        };
      }

      try {
        await requireAIPlan(session.user.id);
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Actualiza tu plan para acceder a Orvenix AI.",
        };
      }

      const result = await runOrvenixAgent(
        {
          siteId: preview.reservedSiteId,
          message: preview.request,
          mode: "execute",
          confirmed: true,
          business: preview.business,
          siteCreationPlan: preview.plan,
        },
        {
          createDraftSite: () =>
            createDraftSiteFromPersistedPreview({
              userId: session.user.id,
              previewId,
              expectedPreviewHash,
            }),
        },
      );

      if (!result.ok) {
        return {
          success: false,
          message: result.message || getSiteCreationPreviewFailureMessage(result.warnings[0]),
        };
      }

      if (result.createdSite?.verified) {
        revalidatePath("/dashboard");
      }

      return {
        success: true,
        result,
        previewId,
        previewHash: expectedPreviewHash,
        siteId: result.createdSite?.siteId,
        nextRoute: result.createdSite?.nextRoute,
      };
    }

    const result = await runOrvenixAgent({
      siteId: "draft:site-creation:" + session.user.id,
      message: siteCreationRequest,
      mode: "preview",
      business,
    });

    if (
      !result.ok ||
      result.scope !== "site_creation" ||
      result.action !== "preview" ||
      !result.plan?.after
    ) {
      return {
        success: false,
        message: "Orvenix AI no pudo generar un Preview de sitio completo. Intenta de nuevo con una descripcion mas clara.",
      };
    }

    const previewHash = hashEditorTree(result.plan.after);

    const preview = await rememberSiteCreationPreview({
      userId: session.user.id,
      previewHash,
      request: siteCreationRequest,
      business,
      plan: result.plan,
    });

    return {
      success: true,
      result: {
        ...result,
        plan: preview.plan,
        snapshot: preview.plan.snapshot,
      },
      previewId: preview.id,
      previewHash: preview.previewHash,
    };
  } catch (error) {
    return {
      success: false,
      message: getSiteCreationPreviewFailureMessage(error),
    };
  }
}


export async function runOrvenixAgentAction(
  input: OrvenixAgentActionInput,
): Promise<OrvenixAgentActionResult> {
  const siteId =
    input.siteId?.trim();

  const message =
    input.message
      ?.trim()
      .replace(/\s+/g, " ")
      .slice(0, 1000);

  const pageSlug =
    input.pageSlug
      ?.trim()
      .slice(0, 120) ||
    "home";

  const expectedTreeHash =
    input.expectedTreeHash
      ?.trim()
      .toLowerCase();

  if (!siteId) {
    return {
      success: false,
      message:
        "Selecciona un sitio antes de usar Orvenix AI.",
    };
  }

  if (!message) {
    return {
      success: false,
      message:
        "Escribe una instrucción para Orvenix AI.",
    };
  }

  const session =
    await getAuthSession();

  if (!session?.user?.id) {
    return {
      success: false,
      message:
        "Inicia sesión para usar Orvenix AI.",
    };
  }

  try {
    await requireAIPlan(
      session.user.id,
    );
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Actualiza tu plan para acceder a Orvenix AI.",
    };
  }

  const role =
    (
      session.user.role ??
      "CLIENT"
    ) as UserRole;

  const allowed =
    await canManageSite(
      siteId,
      session.user.id,
      role,
    );

  if (!allowed) {
    return {
      success: false,
      message:
        "No tienes permiso para modificar este sitio.",
    };
  }

   try {
    /*
     * Protección contra Preview vencido.
     */
    if (input.mode === "execute") {
      if (
        !expectedTreeHash ||
        !/^[a-f0-9]{64}$/.test(
          expectedTreeHash,
        )
      ) {
        return {
          success: false,
          message:
            "La previsualización ya no es válida. Genera un Preview nuevo antes de aplicar.",
        };
      }

      const currentTree =
        await getEditorTreeFromDb(
          siteId,
          pageSlug,
        );

      const currentTreeHash =
        hashEditorTree(
          currentTree,
        );

      if (
        currentTreeHash !==
        expectedTreeHash
      ) {
        return {
          success: false,
          message:
            "El sitio cambió después del Preview. Revisa una previsualización nueva antes de aplicar.",
        };
      }
    }

    const result =
      await runOrvenixAgent(
        {
          siteId,
          pageSlug,
          message,

          mode:
            input.mode,

          targetNodeId:
            input.targetNodeId
              ?.trim()
              .slice(0, 200),

          targetSectionId:
            input.targetSectionId
              ?.trim()
              .slice(0, 200),

          confirmed:
            input.confirmed ===
            true,
        },

        {
          publishSite:
            createSitePublicationCapability({
              userId:
                session.user.id,

              role,
            }),
        },
      );

    const undoMetadata =
      await registerAIUndoForExecutedResult({
        result,
        userId: session.user.id,
        siteId,
        pageSlug,
        readCanonicalTree: getEditorTreeFromDb,
      });

    const undo = undoMetadata.undo;
    const undoWarning = undoMetadata.undoWarning;

    return {
      success: true,
      result,
      undo,
      undoWarning,

      previewHash:
        result.action === "preview" &&
        result.plan?.before
          ? hashEditorTree(
              result.plan.before,
            )
          : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Orvenix AI no pudo procesar la operación.",
    };
  }
}

export async function rollbackOrvenixAIChangeAction(input: {
  undoId?: string;
}) {
  const undoId = input.undoId?.trim() ?? "";

  if (!undoId) {
    return {
      success: false,
      message: "No encontré un cambio de IA para deshacer.",
    };
  }

  const session = await getAuthSession();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Inicia sesión para deshacer cambios de Orvenix AI.",
    };
  }

  const role = (session.user.role ?? "CLIENT") as UserRole;

  const result = await rollbackOrvenixAIChange({
    undoId,
    actor: {
      userId: session.user.id,
      role,
    },
    deps: {
      canManageSite,
    },
  });

  if (!result.ok || !result.tree) {
    return {
      success: false,
      message: result.message,
      code: result.code,
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: result.message,
    undoId: result.undoId,
    siteId: result.siteId,
    pageSlug: result.pageSlug,
    tree: result.tree,
  };
}
