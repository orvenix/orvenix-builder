"use client"

import type {
  SimplePageSection,
  SimpleSectionContent,
} from "../section-model"
import { BlockCard } from "./BlockCard"
import { GenericPreview } from "./previews/GenericPreview"
import { HeroPreview } from "./previews/HeroPreview"
import { ServicesPreview } from "./previews/ServicesPreview"

interface BlockRendererProps {
  section: SimplePageSection
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
  onDelete: () => void
  onContentChange: (content: SimpleSectionContent) => void
}

function renderPreview(
  section: SimplePageSection,
  onContentChange: (content: SimpleSectionContent) => void,
) {
  switch (section.type) {
    case "hero":
      return (
        <HeroPreview
          content={section.content}
          onContentChange={onContentChange}
        />
      )

    case "services":
  return (
    <ServicesPreview
      content={section.content}
      onContentChange={onContentChange}
    />
  )

    default:
      return (
        <GenericPreview
          title={section.content.title}
          description={section.content.description}
        />
      )
  }
}

export function BlockRenderer({
  section,
  selected,
  onSelect,
  onDuplicate,
  onToggleVisibility,
  onDelete,
  onContentChange,
}: BlockRendererProps) {
  return (
    <BlockCard
      name={section.name}
      selected={selected}
      visible={section.visible}
      onSelect={onSelect}
      onDuplicate={onDuplicate}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
    >
      {renderPreview(section, onContentChange)}
    </BlockCard>
  )
}
