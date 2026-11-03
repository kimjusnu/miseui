import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"

type EditableBlurAction = "commit" | "revert"
type EditableField = HTMLInputElement | HTMLTextAreaElement

interface UseEditableOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onEditingChange?: (editing: boolean) => void
  /** Return a message to refuse the value. */
  validate?: (value: string) => string | undefined
  blurAction: EditableBlurAction
  multiline: boolean
  selectOnEdit: boolean
  disabled: boolean
}

/** Composition is checked by the caller: during IME input Enter confirms the syllable and Escape cancels it, not the field. */
function keyAction(event: React.KeyboardEvent, onField: boolean, multiline: boolean) {
  if (event.key === "Escape") return "cancel"
  if (event.key !== "Enter" || !onField) return null
  // Enter belongs to the text in a multi-line field, so only Mod+Enter commits there.
  return multiline && !event.metaKey && !event.ctrlKey ? null : "commit"
}

/** Puts focus in the field on the way in, and back on the text only after a keyboard finish. */
function useEditFocus(editing: boolean, selectOnEdit: boolean) {
  const fieldRef = useRef<EditableField | null>(null)
  const readRef = useRef<HTMLButtonElement | null>(null)
  // Set by a keyboard finish only: a click elsewhere must keep the focus it just took.
  const returnFocusRef = useRef(false)
  useEffect(() => {
    if (editing) {
      const field = fieldRef.current
      field?.focus({ preventScroll: true })
      if (selectOnEdit) field?.select()
      else field?.setSelectionRange(field.value.length, field.value.length)
      return
    }
    if (returnFocusRef.current) {
      returnFocusRef.current = false
      readRef.current?.focus({ preventScroll: true })
    }
  }, [editing, selectOnEdit])
  return { fieldRef, readRef, returnFocusRef }
}

function useEditable(options: UseEditableOptions) {
  const { value: controlled, defaultValue = "", onValueChange, onEditingChange, validate, blurAction, multiline, selectOnEdit, disabled } = options
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)
  const value = controlled ?? uncontrolled
  const errorId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { fieldRef, readRef, returnFocusRef } = useEditFocus(editing, selectOnEdit)

  const finish = (restoreFocus: boolean) => {
    returnFocusRef.current = restoreFocus
    setError(undefined)
    setEditing(false)
    onEditingChange?.(false)
  }

  const start = () => {
    if (disabled || editing) return
    setDraft(value)
    setEditing(true)
    onEditingChange?.(true)
  }

  const cancel = (restoreFocus = true) => finish(restoreFocus)
  /** A refused value keeps the field open with its message: throwing away what someone typed is the worse failure. */
  const commit = (restoreFocus = true) => {
    const message = validate?.(draft)
    if (message) {
      setError(message)
      return
    }
    if (draft !== value) {
      setUncontrolled(draft)
      onValueChange?.(draft)
    }
    finish(restoreFocus)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!editing || event.nativeEvent.isComposing) return
    const action = keyAction(event, event.target === fieldRef.current, multiline)
    if (!action) return
    if (action === "cancel") {
      // A dialog around this field must not close along with the edit.
      event.stopPropagation()
      cancel()
    } else {
      event.preventDefault()
      commit()
    }
  }

  /** Listens on the root so moving from the field to its own buttons is not a way out. */
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null
    if (!editing || (next && rootRef.current?.contains(next))) return
    if (blurAction === "commit") commit(false)
    else cancel(false)
  }

  /** A pasted line break would otherwise sneak into a value that has no way to show it. */
  const onDraftChange = (next: string) => {
    setDraft(multiline ? next : next.replace(/\r?\n/g, " "))
    setError(undefined)
  }

  return { value, editing, draft, error, errorId, fieldRef, readRef, rootRef, start, commit, cancel, onKeyDown, onBlur, onDraftChange }
}

export { useEditable, type EditableBlurAction, type EditableField }
