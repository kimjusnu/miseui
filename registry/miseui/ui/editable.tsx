import type * as React from "react"
import { EditableActions, EditablePencil } from "@/registry/miseui/ui/editable-parts"
import { useEditable, type EditableBlurAction } from "@/registry/miseui/ui/editable-state"
import { cn } from "@/registry/miseui/lib/utils"

type EditableVariant = "text" | "heading" | "area" | "field"
type EditableEffect = "materialize"
type EditableState = ReturnType<typeof useEditable>
type EditorState = Pick<EditableState, "draft" | "error" | "errorId" | "fieldRef" | "onDraftChange">

/**
 * The read view and the input share one type class and one box model, down to the transparent border,
 * so switching between them does not move a single pixel of the surrounding layout.
 */
const TYPE_CLASS: Record<EditableVariant, string> = {
  text: "truncate px-2 py-1 text-sm leading-6 pointer-coarse:py-2",
  heading: "wrap-anywhere whitespace-pre-wrap px-2 py-1 text-2xl leading-8 font-semibold tracking-tight",
  area: "wrap-anywhere whitespace-pre-wrap px-3 py-2 text-sm leading-6",
  field: "truncate px-3 py-1.5 pr-10 text-sm leading-6 pointer-coarse:py-2",
}
const READ_HOVER_CLASS: Record<EditableVariant, string> = {
  text: "hover:bg-accent",
  heading: "hover:bg-accent",
  area: "hover:bg-accent",
  field: "hover:border-input",
}
const BOX_CLASS = "col-start-1 row-start-1 block w-full min-w-0 rounded-md border"
/** Zero width: makes a trailing line break take up a line in the sizing copy, as it does in the textarea. */
const LINE_END = String.fromCharCode(0x200b)
const FIELD_CLASS = "resize-none overflow-hidden border-input bg-transparent ring-[3px] ring-ring/50 outline-none"
type EditableProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string
  defaultValue?: string
  /** Fires on commit only, never per keystroke. */
  onValueChange?: (value: string) => void
  onEditingChange?: (editing: boolean) => void
  /** Return a message to refuse the value; the field stays open and shows it. */
  validate?: (value: string) => string | undefined
  /** `text` inline, `heading` page title, `area` several lines with save and cancel, `field` a settings row boxed on hover. */
  variant?: EditableVariant
  /** `materialize` brings the action buttons into focus when editing starts. */
  effect?: EditableEffect
  /** What leaving the field means. Defaults to `commit`. */
  blurAction?: EditableBlurAction
  /** Shows save and cancel buttons. Defaults to on for `area` and `field`. */
  showActions?: boolean
  /** The name of the thing being edited, used to name the controls. */
  label: string
  placeholder?: string
  maxLength?: number
  selectOnEdit?: boolean
  disabled?: boolean
  saveLabel?: string
  cancelLabel?: string
}

interface EditorProps extends EditorState, Pick<EditableProps, "label" | "placeholder" | "maxLength"> {
  variant: EditableVariant
  roomForActions: boolean
}

function EditableEditor({ draft, error, errorId, fieldRef, onDraftChange, variant, label, placeholder, maxLength, roomForActions }: EditorProps) {
  const usesTextarea = variant === "area" || variant === "heading"
  const box = cn(BOX_CLASS, TYPE_CLASS[variant])
  const field = {
    "aria-label": label,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    placeholder,
    maxLength,
    value: draft,
    className: cn(box, FIELD_CLASS, roomForActions && "pr-20 pointer-coarse:pr-24", error && "border-destructive ring-destructive/20"),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onDraftChange(event.target.value),
  }
  if (!usesTextarea) return <input ref={fieldRef as React.Ref<HTMLInputElement>} type="text" {...field} />
  return (
    <>
      {/* The same text in the same box, invisible: it gives the textarea its height, so nothing jumps as lines come and go. */}
      <div aria-hidden="true" className={cn(box, "invisible border-transparent")}>
        {`${draft || placeholder}${LINE_END}`}
      </div>
      <textarea ref={fieldRef as React.Ref<HTMLTextAreaElement>} rows={1} {...field} />
    </>
  )
}

interface ReadViewProps extends Pick<EditableProps, "label" | "placeholder" | "disabled"> {
  value: string
  variant: EditableVariant
  readRef: React.Ref<HTMLButtonElement>
  onStart: () => void
}

function ReadView({ value, variant, label, placeholder, disabled, readRef, onStart }: ReadViewProps) {
  return (
    <button
      ref={readRef}
      type="button"
      disabled={disabled}
      aria-label={`Edit ${label}: ${value || placeholder}`}
      onClick={onStart}
      className={cn(
        BOX_CLASS,
        TYPE_CLASS[variant],
        "group/read relative border-transparent text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) disabled:pointer-events-none disabled:opacity-50",
        READ_HOVER_CLASS[variant],
        !value && "text-muted-foreground",
      )}
    >
      {value || placeholder}
      {variant === "field" ? <EditablePencil /> : null}
    </button>
  )
}

function Editable({
  value: valueProp, defaultValue, onValueChange, onEditingChange, validate, variant = "text", effect, blurAction = "commit", showActions, label,
  placeholder = "Empty", maxLength, selectOnEdit = true, disabled = false, saveLabel = "Save", cancelLabel = "Cancel", className, onKeyDown, onBlur, ...props
}: EditableProps) {
  const options = { value: valueProp, defaultValue, onValueChange, onEditingChange, validate, blurAction, selectOnEdit, disabled }
  const { value, editing, draft, error, errorId, fieldRef, readRef, rootRef, start, commit, cancel, onDraftChange, ...handlers } = useEditable({ ...options, multiline: variant === "area" })
  const actions = showActions ?? (variant === "area" || variant === "field")
  const inside = variant === "field"
  const editor = { draft, error, errorId, fieldRef, onDraftChange, variant, label, placeholder, maxLength, roomForActions: actions && inside }
  return (
    <div
      ref={rootRef}
      data-slot="editable"
      data-variant={variant}
      data-effect={effect}
      data-state={editing ? "editing" : "reading"}
      className={cn("relative grid min-w-0 grid-cols-[minmax(0,1fr)]", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        handlers.onKeyDown(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        handlers.onBlur(event)
      }}
      {...props}
    >
      {editing ? <EditableEditor {...editor} /> : <ReadView {...{ value, variant, label, placeholder, disabled, readRef }} onStart={start} />}
      {editing && actions ? <EditableActions inside={inside} materialize={effect === "materialize"} {...{ saveLabel, cancelLabel }} onSave={() => commit()} onCancel={() => cancel()} /> : null}
      {editing && error ? (
        <p id={errorId} role="alert" data-slot="editable-error" className={cn("absolute top-full left-0 z-10 mt-1 text-[13px] leading-5 text-destructive", actions && !inside && "max-w-[calc(100%-6rem)]")}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { Editable, type EditableProps, type EditableVariant, type EditableEffect, type EditableBlurAction }
