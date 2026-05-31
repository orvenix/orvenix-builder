import type { EditorNode, EditorTree } from "@/types/editor";
import type { AuditIssue } from "./seoAudit";

function getAllNodes(tree: EditorTree): EditorNode[] {
  return Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
}

function getStringProp(node: EditorNode, key: string): string {
  const value = (node.props as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function getNumberProp(node: EditorNode, key: string): number | null {
  const value = (node.props as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function runPerformanceAudit(tree: EditorTree): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const nodes = getAllNodes(tree);
  const images = nodes.filter((node) => node.type === "image");
  const freeNodes = nodes.filter(
    (node) => (node.props as Record<string, unknown>).positionMode === "free"
  );
  const animatedNodes = nodes.filter((node) => {
    const animation = (node.props as Record<string, unknown>).motionAnimation;
    return typeof animation === "string" && animation !== "none";
  });
  const customCssNodes = nodes.filter((node) => getStringProp(node, "customCss").length > 0);

  if (nodes.length > 90) {
    issues.push({
      id: "perf-node-count-high",
      domain: "performance",
      severity: "warning",
      title: "Árbol de página grande",
      message: `La página tiene ${nodes.length} nodos. Un árbol grande puede volver más pesado el render del editor y la publicación.`,
      autoFixable: false,
    });
  } else if (nodes.length > 60) {
    issues.push({
      id: "perf-node-count-medium",
      domain: "performance",
      severity: "info",
      title: "Árbol de página en crecimiento",
      message: `La página ya acumula ${nodes.length} nodos. Conviene vigilar complejidad visual y componentes repetidos.`,
      autoFixable: false,
    });
  }

  if (freeNodes.length > 12) {
    issues.push({
      id: "perf-many-free-nodes",
      domain: "performance",
      severity: "warning",
      title: "Muchos nodos en posición libre",
      message: `${freeNodes.length} bloques usan posicionamiento libre. Esto complica layout responsive y aumenta trabajo del canvas.`,
      autoFixable: false,
    });
  }

  if (animatedNodes.length > 12) {
    issues.push({
      id: "perf-many-animations",
      domain: "performance",
      severity: "warning",
      title: "Demasiadas animaciones activas",
      message: `${animatedNodes.length} bloques tienen animaciones. Reducirlas ayuda a mantener fluidez en dispositivos modestos.`,
      autoFixable: false,
    });
  } else if (animatedNodes.length > 6) {
    issues.push({
      id: "perf-some-animations",
      domain: "performance",
      severity: "info",
      title: "Varias animaciones simultáneas",
      message: `${animatedNodes.length} bloques animados pueden afectar experiencia móvil si coinciden en el primer viewport.`,
      autoFixable: false,
    });
  }

  if (animatedNodes.length > 6) {
    animatedNodes.slice(6).forEach((node, index) => {
      issues.push({
        id: `perf-disable-extra-animation-${node.id}`,
        domain: "performance",
        severity: index < 3 ? "warning" : "info",
        title: "Animación prescindible en viewport",
        message: "Este bloque puede perder su animación sin afectar estructura ni contenido, mejorando fluidez general.",
        nodeId: node.id,
        autoFixable: true,
        fix: () => ({ motionAnimation: "none" }),
      });
    });
  }

  images.forEach((node) => {
    const width = getNumberProp(node, "width");
    const height = getNumberProp(node, "height");
    const src = getStringProp(node, "src");

    if ((!width || !height) && src) {
      issues.push({
        id: `perf-image-size-missing-${node.id}`,
        domain: "performance",
        severity: "warning",
        title: "Imagen sin dimensiones explícitas",
        message: "Definir ancho y alto ayuda a evitar layout shift y mejora estabilidad visual durante la carga.",
        nodeId: node.id,
        autoFixable: false,
      });
    }
  });

  if (images.length > 10) {
    issues.push({
      id: "perf-many-images",
      domain: "performance",
      severity: "info",
      title: "Página con muchas imágenes",
      message: `${images.length} imágenes pueden aumentar peso de descarga. Revisa compresión y prioridad de contenido.`,
      autoFixable: false,
    });
  }

  customCssNodes.forEach((node) => {
    const css = getStringProp(node, "customCss");
    if (css.length > 500) {
      issues.push({
        id: `perf-custom-css-heavy-${node.id}`,
        domain: "performance",
        severity: css.length > 1200 ? "warning" : "info",
        title: "CSS personalizado extenso",
        message: `Este bloque contiene ${css.length} caracteres de CSS personalizado. Conviene simplificar reglas para mantener el editor ágil.`,
        nodeId: node.id,
        autoFixable: false,
      });
    }
  });

  return issues;
}

export function calcPerformanceScore(issues: AuditIssue[]): number {
  const perfIssues = issues.filter((issue) => issue.domain === "performance");
  const penalties = perfIssues.reduce((sum, issue) => {
    if (issue.severity === "error") return sum + 30;
    if (issue.severity === "warning") return sum + 12;
    return sum + 4;
  }, 0);
  return Math.max(0, 100 - penalties);
}
