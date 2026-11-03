import type * as React from "react"
import { Check, Pencil, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

const ACTION_CLASS = [
  "inline-flex size-8 items-center justify-center rounded-md outline-none pointer-coarse:size-10",
  "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
]
const PENCIL_CLASS = [
  "absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground opacity-0 motion-reduce:transition-none",
  "transition-opacity duration-(--duration-fast) group-hover/read:opacity-100 group-focus-visible/read:opacity-100 pointer-coarse:opacity-100",
]

function EditablePencil() {
  return <Pencil aria-hidden="true" className={cn(PENCIL_CLASS)} />
}

interface ActionsProps {
  inside: boolean
  materialize: boolean
  saveLabel: string
  cancelLabel: string
  onSave: () => void
  onCancel: () => void
}

function EditableActions({ inside, materialize, saveLabel, cancelLabel, onSave, onCancel }: ActionsProps) {
  const reduceMotion = useReducedMotion() ?? false
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(4px)" }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }
  const position = inside
    ? "absolute top-1/2 right-1 z-10 -translate-y-1/2"
    : "absolute top-full right-0 z-10 mt-1 rounded-md border bg-popover p-1 shadow-md"
  const shared = {
    "data-slot": "editable-actions",
    className: cn("flex gap-1", position),
    // Keeps focus in the field, so the press is not read as leaving it. Safari gives buttons no focus at all.
    onPointerDown: (event: React.PointerEvent) => event.preventDefault(),
  }
  const buttons = (
    <>
      <button type="button" aria-label={cancelLabel} className={cn(ACTION_CLASS, "text-muted-foreground hover:bg-accent hover:text-foreground")} onClick={onCancel}>
        <X aria-hidden="true" className="size-4" />
      </button>
      <button type="button" aria-label={saveLabel} className={cn(ACTION_CLASS, "bg-mise text-mise-foreground hover:bg-mise/90")} onClick={onSave}>
        <Check aria-hidden="true" className="size-4" />
      </button>
    </>
  )
  if (!materialize) return <div {...shared}>{buttons}</div>
  return (
    <motion.div {...shared} initial={hidden} animate={shown} transition={SPRING_DEFAULT}>
      {buttons}
    </motion.div>
  )
}

export { EditableActions, EditablePencil }
