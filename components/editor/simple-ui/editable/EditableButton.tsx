"use client"

import { EditableText } from "./EditableText"

interface EditableButtonProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function EditableButton({
  value,
  onChange,
  className = "",
}: EditableButtonProps) {
  return (
    <span
      className={[
        "inline-flex rounded-xl bg-sky-500 px-5 py-3",
        "text-sm font-bold text-white shadow-sm",
        className,
      ].join(" ")}
    >
      <EditableText
        value={value}
        onChange={onChange}
        variant="button"
        ariaLabel="Texto del botón editable"
        editingClassName="bg-sky-600"
      />
    </span>
  )
}
