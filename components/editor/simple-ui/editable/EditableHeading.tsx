"use client"

import { EditableText } from "./EditableText"

interface EditableHeadingProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function EditableHeading({
  value,
  onChange,
  className = "",
}: EditableHeadingProps) {
  return (
    <EditableText
      value={value}
      onChange={onChange}
      variant="heading"
      ariaLabel="Título editable"
      className={className}
    />
  )
}
