"use client"

import { EditableText } from "./EditableText"

interface EditableParagraphProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function EditableParagraph({
  value,
  onChange,
  className = "",
}: EditableParagraphProps) {
  return (
    <EditableText
      value={value}
      onChange={onChange}
      variant="paragraph"
      multiline
      ariaLabel="Párrafo editable"
      className={className}
    />
  )
}
