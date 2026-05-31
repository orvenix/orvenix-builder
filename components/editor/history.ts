import type { Patch } from "immer";

/**
 * Una entrada del historial.
 *
 * En vez de guardar el árbol entero, guardamos los patches generados
 * por Immer. Cada patch describe una operación atómica:
 *   { op: "replace", path: ["nodes", "n_abc", "props", "text"], value: "Hola" }
 *
 * Ventajas:
 *   - Memoria: bytes en vez de MB
 *   - Granularidad: undo de un texto no afecta posición de otros bloques
 *   - Compositibilidad: agrupar varias mutaciones en un solo undo es trivial
 */
export interface HistoryEntry {
  /** Patches que aplican el cambio (forward). */
  patches: Patch[];
  /** Patches que revierten el cambio (backward). */
  inversePatches: Patch[];
  /**
   * Etiqueta semántica de la operación. Usada para coalescing:
   *   - "edit-prop:n_abc:text" → todos los cambios al texto del nodo n_abc
   *   - "move-node"            → no coalesce
   *   - "add-node"             → no coalesce
   */
  label: string;
  /** Timestamp en ms para la ventana de coalescing. */
  timestamp: number;
  /**
   * Selección antes/después del cambio.
   * Restauramos la selección al hacer undo/redo — esto es lo que
   * hace que "deshacer" se sienta correcto.
   */
  selectionBefore: string | null;
  selectionAfter: string | null;
}

/**
 * Gestiona el estado del historial para la UI.
 */
export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  /** Indica si hay cambios sin guardar en el servidor */
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================================
// Coalescing
// ============================================================

/** Ventana de tiempo dentro de la cual fusionamos entradas del mismo tipo. */
const COALESCE_WINDOW_MS = 600;

/**
 * Decide si una nueva entrada debe fusionarse con la última del historial,
 * en lugar de crear un nuevo paso de undo.
 *
 * Solo fusionamos cuando:
 *   - Misma label (mismo tipo de op + mismo nodo + misma prop)
 *   - Dentro de la ventana de tiempo
 *   - Es una operación coalescible (editar text/number, no mover/borrar)
 */
export function shouldCoalesce(
  previous: HistoryEntry | undefined,
  next: HistoryEntry
): boolean {
  if (!previous) return false;
  if (previous.label !== next.label) return false;
  if (next.timestamp - previous.timestamp > COALESCE_WINDOW_MS) return false;

  // Solo coalescemos operaciones explícitamente marcadas
  const coalescibleLabels = [
    "edit-prop:", 
    "move-free-node:", 
    "move-free-nodes:",
    "resize-free-node:"
  ];
  return coalescibleLabels.some(l => next.label.startsWith(l));
}

/**
 * Fusiona dos entradas: mantenemos los patches forward de la nueva
 * (son los que llevan al estado final) y los inversePatches de la
 * antigua (son los que llevan al estado original).
 *
 * Es como decir: "ignora los pasos intermedios, solo recuerda dónde
 * empezamos y dónde terminamos".
 */
export function coalesce(
  previous: HistoryEntry,
  next: HistoryEntry
): HistoryEntry {
  return {
    patches: next.patches,
    inversePatches: previous.inversePatches,
    label: next.label,
    timestamp: next.timestamp,
    selectionBefore: previous.selectionBefore,
    selectionAfter: next.selectionAfter,
  };
}

// ============================================================
// Constantes
// ============================================================

export const HISTORY_LIMIT = 100;
