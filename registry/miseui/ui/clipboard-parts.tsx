import type * as React from "react"
import { Check, Copy, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { ClipboardStatus } from "@/registry/miseui/ui/clipboard-state"
import { cn } from "@/registry/miseui/lib/utils"

const GLYPH: Record<ClipboardStatus, typeof Copy> = { idle: Copy, copied: Check, failed: X }
/** Fixed hues: this is a result, and the accent may itself be amber or red. */
const GLYPH_TONE: Record<ClipboardStatus, string> = {
  idle: "",
  copied: "text-emerald-600 dark:text-emerald-400",
  failed: "text-destructive",
}
const BUTTON_BASE = [
  "inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium outline-none",
  "transition-[color,background-color,box-shadow,scale] duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-100 motion-reduce:active:scale-100",
  "disabled:pointer-events-none disabled:opacity-50",
]
const QUIET = "rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
const BUTTON_SHAPE = {
  icon: cn(QUIET, "size-8 pointer-coarse:size-10"),
  joined: "rounded-r-md border-l px-3 hover:bg-accent",
  header: cn(QUIET, "h-8 px-2 text-[13px] pointer-coarse:h-10"),
}
const FOCUS_INSIDE = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"

function CopyGlyph({ status, morph }: { status: ClipboardStatus; morph: boolean }) {
  const reduceMotion = useReducedMotion() ?? false
  const Icon = GLYPH[status]
  if (!morph || reduceMotion) return <Icon aria-hidden="true" className={cn("size-4 shrink-0", GLYPH_TONE[status])} />
  const away = { opacity: 0, scale: 0.5, filter: "blur(4px)" }
  return (
    <span aria-hidden="true" data-slot="clipboard-morph" className="grid size-4 shrink-0 *:col-start-1 *:row-start-1">
      <AnimatePresence initial={false}>
        <motion.span
          key={status}
          className="block"
          initial={away}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={away}
          transition={SPRING_DEFAULT}
        >
          <Icon className={cn("size-4", GLYPH_TONE[status])} />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

interface CopyButtonProps {
  shape: keyof typeof BUTTON_SHAPE
  status: ClipboardStatus
  morph: boolean
  label: string
  copiedLabel: string
  disabled?: boolean
  onClick: () => void
}

function CopyButton({ shape, status, morph, label, copiedLabel, disabled, onClick }: CopyButtonProps) {
  const copied = status === "copied"
  return (
    <button
      type="button"
      data-slot="clipboard-button"
      data-state={status}
      // The visible word goes invisible while copied, which would leave the button without a name.
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(BUTTON_BASE, BUTTON_SHAPE[shape])}
    >
      <CopyGlyph status={status} morph={morph} />
      {shape === "icon" ? null : (
        // Both words stay in the grid, so the button keeps one width and the row beside it does not twitch on every copy.
        <span className="grid *:col-start-1 *:row-start-1">
          <span className={cn(copied && "invisible")}>{label}</span>
          <span aria-hidden="true" className={cn(!copied && "invisible")}>
            {copiedLabel}
          </span>
        </span>
      )}
    </button>
  )
}

interface BodyProps {
  value: string
  valueLabel: string
  textRef: React.RefObject<HTMLElement | null>
  button: React.ReactNode
}

function InlineBody({ value, valueLabel, textRef, button }: BodyProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-md bg-muted pr-1 pl-3">
      <code
        ref={textRef}
        tabIndex={0}
        aria-label={valueLabel}
        className={cn("min-w-0 flex-1 overflow-x-auto py-2 font-mono text-[13px] leading-5 whitespace-nowrap", FOCUS_INSIDE)}
      >
        {value}
      </code>
      {button}
    </div>
  )
}

function FieldBody({ value, valueLabel, textRef, button, disabled }: BodyProps & { disabled?: boolean }) {
  return (
    <div className="flex min-w-0 rounded-md border border-input shadow-xs">
      <input
        ref={textRef as React.Ref<HTMLInputElement>}
        readOnly
        value={value}
        aria-label={valueLabel}
        disabled={disabled}
        onFocus={(event) => event.currentTarget.select()}
        className={cn("h-9 min-w-0 flex-1 rounded-l-md bg-transparent px-3 font-mono text-base pointer-coarse:h-10 md:text-[13px]", FOCUS_INSIDE)}
      />
      {button}
    </div>
  )
}

function BlockBody({ value, valueLabel, textRef, button, title }: BodyProps & { title?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-3 border-b py-1 pr-1 pl-3">
        <span className="min-w-0 truncate text-[13px] text-muted-foreground">{title}</span>
        {button}
      </div>
      <pre
        ref={textRef as React.Ref<HTMLPreElement>}
        tabIndex={0}
        aria-label={valueLabel}
        className={cn("max-h-64 overflow-auto p-3 font-mono text-[13px] leading-5", FOCUS_INSIDE)}
      >
        {value}
      </pre>
    </div>
  )
}

export { CopyButton, InlineBody, FieldBody, BlockBody }
