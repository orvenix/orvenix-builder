import { runPerformanceAudit } from "@/lib/audit/performanceAudit"
import { runSeoAudit, type AuditIssue } from "@/lib/audit/seoAudit"
import { runWcagAudit } from "@/lib/audit/wcagAudit"
import type { EditorTree } from "@/types/editor"

export interface AuditNodePatch {
  issueId: string
  domain: AuditIssue["domain"]
  nodeId: string
  patch: Record<string, unknown>
}

export interface AuditFixPlan {
  issueIds: string[]
  seoPatch: Record<string, unknown>
  nodePatches: AuditNodePatch[]
}

function toPatch(issue: AuditIssue) {
  if (!issue.autoFixable || !issue.fix) return null
  const patch = issue.fix()
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return null
  return patch
}

export function buildAuditFixPlan(tree: EditorTree): AuditFixPlan {
  const issues = [
    ...runSeoAudit(tree),
    ...runWcagAudit(tree),
    ...runPerformanceAudit(tree),
  ]

  const seoPatch: Record<string, unknown> = {}
  const nodePatches: AuditNodePatch[] = []
  const issueIds: string[] = []

  for (const issue of issues) {
    const patch = toPatch(issue)
    if (!patch) continue
    issueIds.push(issue.id)
    if (issue.nodeId) {
      nodePatches.push({
        issueId: issue.id,
        domain: issue.domain,
        nodeId: issue.nodeId,
        patch,
      })
      continue
    }
    Object.assign(seoPatch, patch)
  }

  return {
    issueIds,
    seoPatch,
    nodePatches,
  }
}
