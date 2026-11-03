import type * as React from "react"
import { useImperativeHandle, useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Search, X } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Kbd, KbdGroup, Mod } from "@/registry/miseui/ui/kbd"
import { DEFAULT_DEBOUNCE_MS, useSearchFieldState } from "@/registry/miseui/ui/search-field-state"
import { Spinner } from "@/registry/miseui/ui/spinner"
import { cn } from "@/registry/miseui/lib/utils"

type SearchFieldVariant = "plain" | "pill" | "ghost" | "large"
type SearchFieldEffect = "spinner-swap"

const SWAP_SCALE = 0.6

const FRAME_BASE_CLASS = [
  "group/search flex w-full min-w-0 items-center gap-2 pl-3",
  "transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "has-[input:disabled]:pointer-events-none has-[input:disabled]:opacity-50",
]

const FRAME_CLASS: Record<SearchFieldVariant, string> = {
  plain:
    "h-9 rounded-md border border-input bg-transparent pr-1 shadow-xs pointer-coarse:h-10 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
  // Sinks into the page until it is used, then lifts onto the surface.
  pill: "h-9 rounded-full bg-muted pr-1 pointer-coarse:h-10 has-[input:focus-visible]:bg-background has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
  // Only a hairline underneath: this one lives in toolbars and list headers that already have a frame.
  ghost: "h-9 rounded-none border-b border-transparent pl-0 pr-0 pointer-coarse:h-10 hover:border-border has-[input:focus-visible]:border-foreground",
  large:
    "h-12 gap-3 rounded-lg border border-input bg-card pl-4 pr-2 shadow-sm has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
}

const INPUT_CLASS: Record<SearchFieldVariant, string> = {
  plain: "text-base md:text-sm",
  pill: "text-base md:text-sm",
  ghost: "text-base md:text-sm",
  large: "text-base md:text-[15px]",
}

const CLEAR_CLASS = [
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground pointer-coarse:size-10",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "active:bg-accent active:duration-0",
]

const ICON_SIZE: Record<SearchFieldVariant, string> = { plain: "size-4", pill: "size-4", ghost: "size-4", large: "size-5" }

type SearchFieldProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "type" | "size"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Fires after typing stops, at once on Enter and on clear. Never twice for the same text. */
  onSearch?: (query: string) => void
  debounceMs?: number
  /** Results are on their way. */
  loading?: boolean
  /** Read to assistive tech while loading. */
  loadingText?: string
  /** Shows the Mod K hint and listens for the shortcut anywhere on the page. Leave off when two fields share a page. */
  shortcut?: boolean
  clearLabel?: string
  /** `plain` a field, `pill` a filled capsule, `ghost` no frame until used, `large` the main thing on a page. */
  variant?: SearchFieldVariant
  /** `spinner-swap` turns the leading magnifier into the spinner in place. Without it the spinner sits at the trailing edge. */
  effect?: SearchFieldEffect
}

function LeadingIcon({ variant, swap, reduceMotion }: { variant: SearchFieldVariant; swap: boolean; reduceMotion: boolean }) {
  const size = ICON_SIZE[variant]
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: SWAP_SCALE }
  return (
    <span aria-hidden="true" data-slot="search-field-icon" className={cn("relative flex shrink-0 text-muted-foreground", size)}>
      {/* Both glyphs stack in one box, so the swap can never nudge the text beside them. */}
      <AnimatePresence initial={false}>
        <motion.span
          key={swap ? "spinner" : "search"}
          className="absolute inset-0 flex items-center justify-center"
          initial={hidden}
          animate={{ opacity: 1, scale: 1 }}
          exit={hidden}
          transition={SPRING_DEFAULT}
        >
          {swap ? <Spinner size="sm" className={size} label="" /> : <Search className={size} />}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function ShortcutHint() {
  return (
    <span aria-hidden="true" data-slot="search-field-hint" className="mr-1 shrink-0 group-has-[input:focus]/search:hidden pointer-coarse:hidden">
      <KbdGroup>
        <Mod variant="flat" />
        <Kbd variant="flat">K</Kbd>
      </KbdGroup>
    </span>
  )
}

function SearchField({ value, defaultValue, onValueChange, onSearch, debounceMs = DEFAULT_DEBOUNCE_MS, loading = false, loadingText = "Searching", shortcut = false, clearLabel = "Clear search", variant = "plain", effect, className, ref, placeholder = "Search", disabled, onKeyDown, "aria-label": ariaLabel, ...props }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)
  const reduceMotion = useReducedMotion() ?? false
  const state = useSearchFieldState({ value, defaultValue, onValueChange, onSearch, debounceMs, shortcut, inputRef })
  const swap = effect === "spinner-swap" && loading
  const showClear = state.current !== "" && !disabled
  return (
    <div role="search" data-slot="search-field" data-variant={variant} data-effect={effect} data-loading={loading ? "true" : "false"} className={cn(FRAME_BASE_CLASS, FRAME_CLASS[variant], className)}>
      <LeadingIcon variant={variant} swap={swap} reduceMotion={reduceMotion} />
      <input
        {...props}
        {...state.composition}
        ref={inputRef}
        type="search"
        value={state.current}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        aria-busy={loading || undefined}
        autoComplete="off"
        // The browser's own clear button would sit beside ours in WebKit.
        className={cn("h-full min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none", INPUT_CLASS[variant])}
        onChange={(event) => state.change(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (!event.defaultPrevented) state.onKeyDown(event)
        }}
      />
      {loading && !swap ? (
        <span aria-hidden="true" data-slot="search-field-spinner" className="mr-1 flex shrink-0">
          <Spinner size="sm" label="" />
        </span>
      ) : null}
      {shortcut && !showClear ? <ShortcutHint /> : null}
      {showClear ? (
        <button type="button" aria-label={clearLabel} data-slot="search-field-clear" className={cn(CLEAR_CLASS)} onClick={state.clear}>
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <span role="status" className="sr-only">
        {loading ? loadingText : ""}
      </span>
    </div>
  )
}

export { SearchField, type SearchFieldProps, type SearchFieldVariant, type SearchFieldEffect }
