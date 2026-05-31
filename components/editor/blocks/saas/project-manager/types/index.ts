import type { ColorKey } from "@/app/webs/_shared/lib/colors"

export type Priority = "urgent" | "high" | "medium" | "low"
export type IssueStatus = "todo" | "in_progress" | "in_review" | "done"

export interface Issue {
  id: string
  title: string
  status: IssueStatus
  priority: Priority
  assigneeInitials: string
  assigneeColorKey: ColorKey
  labelText: string
  labelColorKey: ColorKey
  estimate: number
  project: string
}

export interface KanbanCard {
  id: string
  title: string
  tag: string
  tagColorKey: ColorKey
  points: number
  assigneeInitials: string
  assigneeColorKey: ColorKey
}

export interface KanbanColumn {
  id: string
  label: string
  colorKey: ColorKey
  cards: KanbanCard[]
}

export interface Project {
  id: string
  label: string
  colorKey: ColorKey
  count: number
  active?: boolean
}

export interface SprintStat {
  label: string
  value: string
}
