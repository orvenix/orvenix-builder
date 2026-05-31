'use server';

import Anthropic from "@anthropic-ai/sdk";
import type { EditorTree } from "@/types/editor";
import { validateTree } from "@/types/validateTree";
import { getAuthSession } from "@/lib/auth-session";
import { requireAIPlan } from "@/lib/plan-guard";
import { extractFirstJsonObject, normalizeGeneratedTreeCandidate } from "@/lib/ai/generationSchema";
import { runAIGenerationJob } from "@/lib/ai/jobs";
import { buildAuditFixPlan } from "@/lib/audit/fixPlan";

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

const INTENT_COPY: Record<SectionIntent, {
  title: string; subtitle: string; cta: string;
  background: string; titleColor: string; textColor: string;
  buttonVariant: "primary" | "secondary";
}> = {
  hero: {
    title: "Convierte visitantes en clientes con una web lista para crecer",
    subtitle: "Una sección clara, moderna y enfocada en conversión para presentar tu oferta en segundos.",
    cta: "Empezar ahora",
    background: "linear-gradient(135deg,#0f172a 0%,#312e81 55%,#111827 100%)",
    titleColor: "#ffffff", textColor: "#c7d2fe", buttonVariant: "secondary",
  },
  services: {
    title: "Servicios diseñados para acelerar tu siguiente etapa",
    subtitle: "Presenta tu propuesta con beneficios concretos, lenguaje directo y una llamada a la acción fácil de seguir.",
    cta: "Ver servicios",
    background: "#f8fafc", titleColor: "#0f172a", textColor: "#475569", buttonVariant: "primary",
  },
  pricing: {
    title: "Planes simples para lanzar sin fricción",
    subtitle: "Comunica valor, confianza y el siguiente paso ideal para que cada cliente elija con seguridad.",
    cta: "Comparar planes",
    background: "#ffffff", titleColor: "#111827", textColor: "#4b5563", buttonVariant: "primary",
  },
  contact: {
    title: "Hablemos de lo que quieres construir",
    subtitle: "Abre una conversación directa con tus visitantes y convierte interés en oportunidades reales.",
    cta: "Contactar",
    background: "#ecfeff", titleColor: "#164e63", textColor: "#155e75", buttonVariant: "primary",
  },
  testimonials: {
    title: "Resultados reales que construyen confianza",
    subtitle: "Refuerza tu propuesta con testimonios claros, credibilidad visual y mensajes orientados a decisión.",
    cta: "Ver casos de exito",
    background: "#f8fafc", titleColor: "#0f172a", textColor: "#475569", buttonVariant: "primary",
  },
};

function detectIntent(prompt: string): SectionIntent {
  const text = prompt.toLowerCase();
  if (/(precio|pricing|plan|mensual|suscripcion|pago)/.test(text)) return "pricing";
  if (/(testimonio|testimonial|caso de exito|prueba social|reseña|review)/.test(text)) return "testimonials";
  if (/(contact|whatsapp|formulario|agenda|llamada|demo)/.test(text)) return "contact";
  if (/(servicio|beneficio|feature|caracteristica|solucion)/.test(text)) return "services";
  return "hero";
}

function buildFallbackTree(id: string, prompt: string, intent: SectionIntent): EditorTree {
  const copy = INTENT_COPY[intent];
  const subject = prompt
    .replace(/^(crea|genera|haz|quiero|necesito|diseña?)\s+/i, "")
    .replace(/\b(una|un|seccion|sección|bloque|hero|landing)\b/gi, "")
    .trim() || "tu negocio";

  const title = intent === "hero"
    ? `Impulsa ${subject} con una presencia digital memorable`
    : copy.title;

  return {
    rootId: `${id}-section`,
    nodes: {
      [`${id}-section`]: {
        id: `${id}-section`, type: "section",
        props: { paddingY: "xl", paddingX: "md", align: intent === "services" ? "left" : "center", background: copy.background, maxWidth: "lg" },
        children: [`${id}-eyebrow`, `${id}-heading`, `${id}-text`, `${id}-cta`],
        version: 1,
      },
      [`${id}-eyebrow`]: {
        id: `${id}-eyebrow`, type: "text",
        props: { content: `Generado por Orvenix AI · ${subject}`, size: "sm", align: intent === "services" ? "left" : "center", color: copy.textColor },
        children: [], version: 1,
      },
      [`${id}-heading`]: {
        id: `${id}-heading`, type: "heading",
        props: { text: title, level: 2, size: "5xl", weight: "extrabold", align: intent === "services" ? "left" : "center", color: copy.titleColor },
        children: [], version: 1,
      },
      [`${id}-text`]: {
        id: `${id}-text`, type: "text",
        props: { content: copy.subtitle, size: "lg", align: intent === "services" ? "left" : "center", color: copy.textColor, maxWidth: "md" },
        children: [], version: 1,
      },
      [`${id}-cta`]: {
        id: `${id}-cta`, type: "ctaButton",
        props: { label: copy.cta, href: "#", variant: copy.buttonVariant },
        children: [], version: 1,
      },
    },
  };
}

function pickAvailableType(blocks: BlockContext[], preferredTypes: string[]): string | null {
  const available = new Set(blocks.map((block) => block.type));
  return preferredTypes.find((type) => available.has(type)) ?? null;
}

function buildFewShotExamples(blocks: BlockContext[], prompt: string): string {
  const examples: string[] = [];
  const intent = detectIntent(prompt);

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

  return examples.join("\n\n");
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

  const systemPrompt = `Eres Orvenix AI, el asistente de diseño web de Orvenix Builder.
Tu tarea: generar secciones web como árboles de bloques JSON válidos.

BLOQUES DISPONIBLES:
${buildBlockList(blocks)}

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
          message: "✦ Generado por Orvenix AI con los bloques de tu proyecto.",
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
            content: `Genera copy para una sección web tipo "${intent}" sobre: "${normalized}". Responde SOLO con JSON: {"title":"...","subtitle":"...","cta":"..."}`,
          }],
        });
        const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : null;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const copy = JSON.parse(jsonMatch[0]) as { title?: string; subtitle?: string; cta?: string };
            if (copy.title && copy.subtitle && copy.cta) {
              const tree = buildFallbackTree(id, normalized, intent);
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
      tree: buildFallbackTree(id, normalized, intent),
      title: normalized,
      message: "Sección generada y lista para insertar.",
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
