import type * as React from "react"
import { useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Search } from "lucide-react"
import { CommandList } from "@/registry/miseui/ui/command-list"
import { pushRecent, type CommandItem } from "@/registry/miseui/ui/command-score"
import { useCommand, useCommandShortcut } from "@/registry/miseui/ui/command-state"
import {
  INPUT_ROW_CLASS,
  INPUT_TEXT_CLASS,
  LIST_HEIGHT_CLASS,
  MATERIALIZE_CLASS,
  MODAL_POSITION_CLASS,
  OVERLAY_CLASS,
  PLAIN_MOTION_CLASS,
  SURFACE_CLASS,
  type CommandEffect,
  type CommandVariant,
} from "@/registry/miseui/ui/command-classes"
import { cn } from "@/registry/miseui/lib/utils"

const EMPTY_RECENT: readonly string[] = []

type CommandProps = Omit<React.ComponentProps<"div">, "onSelect" | "defaultValue" | "value"> & {
  items: readonly CommandItem[]
  /** `dialog` a centred palette, `inline` part of the page, `compact` dense rows for small spaces, `spotlight` one large input with results below. */
  variant?: CommandVariant
  /** `materialize` brings the palette into focus and lets its height spring as results change. */
  effect?: CommandEffect
  /** Values to lead the list while nothing is typed, newest first. Keep it with `pushRecent`. */
  recent?: readonly string[]
  recentLabel?: string
  placeholder?: string
  emptyText?: React.ReactNode
  /** Name for assistive tech, and the dialog title. */
  label?: string
  onSelect?: (value: string, item: CommandItem) => void
  /** Open state of `dialog` and `spotlight`. Pair with `useCommandShortcut` for Mod+K. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

type PaletteProps = Pick<CommandProps, "items" | "recent" | "recentLabel" | "placeholder" | "emptyText" | "label" | "onSelect"> & {
  variant: CommandVariant
  springHeight: boolean
  inputRef?: React.Ref<HTMLInputElement>
  onDone?: () => void
}

type CommandState = ReturnType<typeof useCommand>

interface CommandInputRowProps {
  state: Pick<CommandState, "query" | "setQuery" | "listId" | "activeOptionId" | "onKeyDown">
  variant: CommandVariant
  label: string
  placeholder: string
  expanded: boolean
  divided: boolean
  inputRef?: React.Ref<HTMLInputElement>
}

function CommandInputRow({ state, variant, label, placeholder, expanded, divided, inputRef }: CommandInputRowProps) {
  return (
    <div data-slot="command-input-row" className={cn("flex shrink-0 items-center", INPUT_ROW_CLASS[variant], divided && "border-b")}>
      <Search aria-hidden="true" className={cn("shrink-0 text-muted-foreground", variant === "spotlight" ? "size-5" : "size-4")} />
      <input
        ref={inputRef}
        role="combobox"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={state.listId}
        aria-autocomplete="list"
        aria-activedescendant={state.activeOptionId}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={state.query}
        onChange={(event) => state.setQuery(event.target.value)}
        onKeyDown={state.onKeyDown}
        className={cn("h-full w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground", INPUT_TEXT_CLASS[variant])}
      />
    </div>
  )
}

function CommandFooter() {
  return (
    <div data-slot="command-footer" className="flex items-center gap-4 border-t px-4 py-2 text-[13px] text-muted-foreground pointer-coarse:hidden">
      <span>↑↓ to move</span>
      <span>Enter to run</span>
      <span className="ml-auto">Esc to close</span>
    </div>
  )
}

function Palette({ items, recent = EMPTY_RECENT, recentLabel = "Recent", placeholder = "Type a command or search", emptyText = "No results.", label = "Command menu", onSelect, variant, springHeight, inputRef, onDone }: PaletteProps) {
  const modal = variant === "dialog" || variant === "spotlight"
  const state = useCommand({ items, recent, recentLabel, clearOnEscape: !modal, recentOnly: variant === "spotlight", onSelect, onDone })
  const { query, visible } = state
  const hasQuery = query.trim().length > 0
  // A spotlight is only the input until it has something to say.
  const showList = visible.length > 0 || hasQuery || variant !== "spotlight"
  return (
    <>
      <CommandInputRow {...{ state, variant, label, placeholder, inputRef }} expanded={visible.length > 0} divided={showList} />
      {showList ? (
        <CommandList
          listId={state.listId}
          label={label}
          sections={state.sections}
          visible={visible}
          active={state.active}
          dense={variant === "compact"}
          maxHeightClass={LIST_HEIGHT_CLASS[variant]}
          springHeight={springHeight}
          emptyText={emptyText}
          showEmpty={hasQuery && visible.length === 0}
          onActive={state.setActiveValue}
          onPick={state.select}
        />
      ) : null}
      <span role="status" data-slot="command-status" className="sr-only">
        {hasQuery ? `${visible.length} ${visible.length === 1 ? "result" : "results"}` : ""}
      </span>
      {variant === "dialog" ? <CommandFooter /> : null}
    </>
  )
}

interface ModalCommandProps extends Pick<CommandProps, "open" | "defaultOpen" | "onOpenChange" | "effect" | "className"> {
  palette: Omit<PaletteProps, "inputRef" | "onDone">
  variant: CommandVariant
  label: string
  rest: React.ComponentProps<"div">
}

function ModalCommand({ open: openProp, defaultOpen = false, onOpenChange, palette, variant, effect, label, className, rest }: ModalCommandProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const inputRef = useRef<HTMLInputElement>(null)
  // There is no Radix trigger here: the palette opens from a shortcut or from any button, so it remembers for itself.
  const returnTo = useRef<HTMLElement | null>(null)
  const open = openProp ?? uncontrolled
  const setOpen = (next: boolean) => {
    setUncontrolled(next)
    onOpenChange?.(next)
  }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-slot="command-overlay" className={OVERLAY_CLASS} />
        <DialogPrimitive.Content
          data-slot="command"
          data-variant={variant}
          data-effect={effect}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            returnTo.current = document.activeElement as HTMLElement | null
            event.preventDefault()
            inputRef.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnTo.current?.focus()
          }}
          className={cn(
            "fixed left-1/2 z-50 flex w-full -translate-x-1/2 flex-col overflow-hidden",
            SURFACE_CLASS[variant],
            MODAL_POSITION_CLASS[variant],
            effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS,
            className,
          )}
          {...rest}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <Palette {...palette} inputRef={inputRef} onDone={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Command({ items, variant = "dialog", effect, recent, recentLabel, placeholder, emptyText, label = "Command menu", onSelect, open, defaultOpen, onOpenChange, className, ...rest }: CommandProps) {
  const palette = { items, variant, recent, recentLabel, placeholder, emptyText, label, onSelect, springHeight: effect === "materialize" }
  if (variant === "dialog" || variant === "spotlight") {
    return <ModalCommand {...{ open, defaultOpen, onOpenChange, palette, variant, effect, label, className, rest }} />
  }
  return (
    <div data-slot="command" data-variant={variant} data-effect={effect} className={cn("flex min-w-0 flex-col overflow-hidden", SURFACE_CLASS[variant], className)} {...rest}>
      <Palette {...palette} />
    </div>
  )
}

export { Command, pushRecent, useCommandShortcut, type CommandProps, type CommandItem, type CommandVariant, type CommandEffect }
