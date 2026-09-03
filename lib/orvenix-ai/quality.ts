import type { EditorTree } from "@/types/editor";
import type { OrvenixAIQualityReport } from "./types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateTreeQuality(
  tree: EditorTree
): OrvenixAIQualityReport {
  const nodes = Object.values(tree.nodes ?? {});

  let design = 70;
  let content = 60;
  let conversion = 55;
  let seo = 50;
  let responsive = 60;
  let accessibility = 60;

  const problems: string[] = [];
  const recommendations: string[] = [];

  const headings = nodes.filter((node) => node.type === "heading");
  const texts = nodes.filter((node) => node.type === "text");
  const buttons = nodes.filter(
    (node) =>
      node.type === "ctaButton" ||
      node.type === "button"
  );
  const images = nodes.filter((node) => node.type === "image");

  const h1Count = headings.filter(
    (node) => Number(node.props?.level) === 1
  ).length;

  if (h1Count === 1) {
    seo += 20;
    content += 5;
  } else {
    problems.push(
      h1Count === 0
        ? "El sitio no tiene un H1 principal."
        : "El sitio contiene más de un H1."
    );

    recommendations.push(
      "Mantener exactamente un H1 principal por página."
    );
  }

  if (texts.length >= 3) {
    content += 10;
  } else {
    problems.push("El sitio tiene poco contenido descriptivo.");
  }

  if (buttons.length >= 2) {
    conversion += 20;
  } else {
    problems.push("Hay pocas llamadas a la acción.");
    recommendations.push(
      "Agregar CTA claros en momentos estratégicos."
    );
  }

  if (tree.seo?.title) seo += 10;
  else {
    problems.push("Falta título SEO.");
    recommendations.push("Generar un título SEO.");
  }

  if (tree.seo?.description) seo += 10;
  else {
    problems.push("Falta descripción SEO.");
    recommendations.push("Generar una descripción SEO.");
  }

  if (tree.theme || tree.globalTheme) {
    design += 10;
  }

  const responsiveNodes = nodes.filter(
    (node) => node.props?.responsive
  ).length;

  if (responsiveNodes > 0) {
    responsive += 15;
  }

  const imagesWithAlt = images.filter(
    (node) =>
      typeof node.props?.alt === "string" &&
      node.props.alt.trim().length > 0
  ).length;

  if (images.length === 0 || imagesWithAlt === images.length) {
    accessibility += 15;
  } else {
    problems.push("Hay imágenes sin texto alternativo.");
    recommendations.push(
      "Agregar texto alternativo descriptivo a las imágenes."
    );
  }

  design = clamp(design);
  content = clamp(content);
  conversion = clamp(conversion);
  seo = clamp(seo);
  responsive = clamp(responsive);
  accessibility = clamp(accessibility);

  const score = clamp(
    design * 0.2 +
      content * 0.2 +
      conversion * 0.2 +
      seo * 0.15 +
      responsive * 0.15 +
      accessibility * 0.1
  );

  return {
    score,
    design,
    content,
    conversion,
    seo,
    responsive,
    accessibility,
    problems,
    recommendations,
  };
}
