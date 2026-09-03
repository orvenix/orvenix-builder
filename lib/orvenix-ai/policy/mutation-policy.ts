import {
  detectMutationScope,
} from "./scope-detector"

import type {
  MutationPolicyDecision,
  MutationPolicyInput,
  MutationScope,
} from "./types"

function limitsForScope(
  scope: MutationScope,
): MutationPolicyDecision["limits"] {
  switch (scope) {
    case "read_only":
      return {
        maxAddedNodes: 0,
        maxRemovedNodes: 0,
        maxChangedNodes: 0,

        requireSnapshot: false,
        requireConfirmation: false,
      }

    case "local_edit":
      return {
        maxAddedNodes: 5,
        maxRemovedNodes: 5,
        maxChangedNodes: 15,

        requireTargetNode: true,

        requireSnapshot: true,
        requireConfirmation: false,
      }


      case "multi_edit":
  return {
    maxAddedNodes: 0,
    maxRemovedNodes: 0,
    maxChangedNodes: 200,

    requireSnapshot: true,
    requireConfirmation: false,
  }

    case "section_edit":
      return {
        maxAddedNodes: 80,
        maxRemovedNodes: 80,
        maxChangedNodes: 120,

        requireTargetSection: true,

        requireSnapshot: true,
        requireConfirmation: false,
      }

        case "page_redesign":
      return {
        maxAddedNodes: 1000,
        maxRemovedNodes: 1000,
        maxChangedNodes: 1000,

        requireSnapshot: true,
        requireConfirmation: true,
      }

    case "site_redesign":
      return {
        maxAddedNodes: 5000,
        maxRemovedNodes: 5000,
        maxChangedNodes: 5000,

        requireSnapshot: true,
        requireConfirmation: true,
      }

    case "site_creation":
      return {
        maxAddedNodes: 5000,
        maxRemovedNodes: 5000,
        maxChangedNodes: 5000,

        requireSnapshot: true,
        requireConfirmation: true,
      }

    case "design_edit":

      return {

        /*

         * Rediseño visual coordinado.

         *

         * Puede modificar Theme y muchos

         * nodos existentes, pero no cambia

         * la estructura del árbol.

         */

        maxAddedNodes: 0,

        maxRemovedNodes: 0,

        maxChangedNodes: 500,


        requireSnapshot: true,

        requireConfirmation: false,

      }


    case "publish":
      return {
        requireSnapshot: true,
        requireConfirmation: true,
      }

      case "theme_edit":
  return {
    maxAddedNodes: 0,
    maxRemovedNodes: 0,
    maxChangedNodes: 0,

    requireSnapshot: true,
    requireConfirmation: false,
  }
  }
}

function checkLimit(
  value: number,
  limit: number | undefined,
  label: string,
  violations: string[],
) {
  if (
    limit !== undefined &&
    value > limit
  ) {
    violations.push(
      `${label}: ${value} supera el límite permitido de ${limit}.`,
    )
  }
}

export function evaluateMutationPolicy(
  input: MutationPolicyInput,
): MutationPolicyDecision {
  const scope =
  input.scopeOverride ??
  detectMutationScope(
    input.request,
  )

  const limits =
    limitsForScope(scope)

  const violations: string[] = []

  /*
   * READ ONLY jamás escribe.
   */
  if (
    scope === "read_only" &&
    (
      input.plan.addedNodes > 0 ||
      input.plan.removedNodes > 0 ||
      input.plan.changedNodes > 0
    )
  ) {
    violations.push(
      "La solicitud es de solo lectura, pero el plan contiene modificaciones.",
    )
  }

  checkLimit(
    input.plan.addedNodes,
    limits.maxAddedNodes,
    "Nodos agregados",
    violations,
  )

  checkLimit(
    input.plan.removedNodes,
    limits.maxRemovedNodes,
    "Nodos eliminados",
    violations,
  )

  checkLimit(
    input.plan.changedNodes,
    limits.maxChangedNodes,
    "Nodos modificados",
    violations,
  )

  if (
    limits.requireTargetNode &&
    !input.targetNodeId
  ) {
    violations.push(
      "La operación local requiere un nodo objetivo.",
    )
  }

  const isAdditiveSectionEdit =
    scope === "section_edit" &&
    input.plan.addedNodes > 0 &&
    input.plan.removedNodes === 0

  if (
    limits.requireTargetSection &&
    !isAdditiveSectionEdit &&
    !input.targetSectionId
  ) {
    violations.push(
      "La operación de sección requiere una sección objetivo.",
    )
  }

  if (
    scope === "publish" &&
    !input.explicitPublish
  ) {
    violations.push(
      "Publicar requiere una orden explícita.",
    )
  }

  if (!input.plan.safe) {
    violations.push(
      "Safety Validator rechazó el árbol.",
    )
  }

  return {
    allowed:
      violations.length === 0,

    scope,

    reason:
      violations.length === 0
        ? `La mutación está dentro del alcance autorizado: ${scope}.`
        : "La mutación excede el alcance autorizado.",

    limits,
    violations,
  }
}
