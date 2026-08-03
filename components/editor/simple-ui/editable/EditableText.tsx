"use client"

import { Pencil } from "lucide-react"
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"

export type EditableTextVariant =
  | "heading"
  | "paragraph"
  | "button"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  variant?: EditableTextVariant
  multiline?: boolean
  className?: string
  editingClassName?: string
  ariaLabel?: string
}

export function EditableText({
  value,
  onChange,
  variant = "paragraph",
  multiline = false,
  className = "",
  editingClassName = "",
  ariaLabel = "Texto editable",
}: EditableTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef(value)
  const cancelNextBlurRef = useRef(false)

  const [editing, setEditing] = useState(false)

  function beginEditing(event: MouseEvent<HTMLSpanElement>) {
    event.preventDefault()
    event.stopPropagation()

    originalValueRef.current = value
    cancelNextBlurRef.current = false
    setEditing(true)

    window.requestAnimationFrame(() => {
      const element = elementRef.current
      if (!element) return

      element.focus()

      const selection = window.getSelection()
      const range = document.createRange()

      range.selectNodeContents(element)
      range.collapse(false)

      selection?.removeAllRanges()
      selection?.addRange(range)
    })
  }

  function commitEditing() {
    const element = elementRef.current

    const nextValue =
      element?.innerText.trim() || originalValueRef.current

    setEditing(false)

    if (element) {
      element.innerText = nextValue
    }

    if (nextValue !== value) {
      onChange(nextValue)
    }
  }

  function cancelEditing() {
    cancelNextBlurRef.current = true

    if (elementRef.current) {
      elementRef.current.innerText = originalValueRef.current
      elementRef.current.blur()
    }

    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      cancelEditing()
      return
    }

    const saveMultiline =
      multiline &&
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)

    const saveSingleLine = !multiline && event.key === "Enter"

    if (saveMultiline || saveSingleLine) {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.blur()
    }
  }

  function handleBlur() {
    if (cancelNextBlurRef.current) {
      cancelNextBlurRef.current = false
      return
    }

    if (editing) {
      commitEditing()
    }
  }

  const variantClasses: Record<EditableTextVariant, string> = {
    heading: "block",
    paragraph: "block whitespace-pre-wrap",
    button: "inline-block",
  }

  return (
    <span className="group/editable relative inline-flex max-w-full">
      <span
        ref={elementRef}
        contentEditable={editing}
        suppressContentEditableWarning
        tabIndex={0}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline={multiline}
        title={
          multiline
            ? "Doble clic para editar. Ctrl + Enter para guardar."
            : "Doble clic para editar."
        }
        onDoubleClick={beginEditing}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(event) => event.stopPropagation()}
        className={[
          variantClasses[variant],
          className,
          "max-w-full rounded-lg outline-none transition duration-150",
          editing
            ? [
                "cursor-text ring-2 ring-cyan-400",
                "bg-white/10 px-2 py-1",
                editingClassName,
              ].join(" ")
            : "cursor-text hover:bg-white/5 hover:ring-1 hover:ring-white/20",
        ].join(" ")}
      >
        {value}
      </span>

      {!editing && (
        <span className="pointer-events-none absolute -right-8 top-1/2 hidden -translate-y-1/2 rounded-lg bg-slate-950/90 p-1.5 text-cyan-300 shadow-lg group-hover/editable:block">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </span>
  )
}
