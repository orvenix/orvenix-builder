"use client"

import {
  Sparkles,
  ShieldCheck,
  Workflow,
  MessageCircle,
  CheckCircle2,
  Star,
  Zap,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import type { BlockComponentProps } from "@/types/editor"

export interface IconProps {
  name?: string
  size?: number
  color?: string
}

/**
 * V2-1: the ONLY safe icon names generated content may reference. Every
 * entry is a statically-imported component -- never a dynamic
 * require/import of a name that came from generated data, so there is no
 * arbitrary-code-execution surface here regardless of what a (buggy or
 * malicious) NodeProps.name value contains: an unrecognized name simply
 * renders nothing (see the component below).
 */
export const ICON_ALLOWLIST: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "shield-check": ShieldCheck,
  workflow: Workflow,
  "message-circle": MessageCircle,
  "check-circle": CheckCircle2,
  star: Star,
  zap: Zap,
  "list-checks": ListChecks,
}

export function Icon({
  name,
  size = 20,
  color,
}: BlockComponentProps<IconProps>) {
  const LucideComponent = name ? ICON_ALLOWLIST[name] : undefined

  if (!LucideComponent) return null

  return <LucideComponent size={size} color={color} strokeWidth={2} aria-hidden="true" />
}

Icon.defaults = {
  name: "sparkles",
  size: 20,
} satisfies IconProps
