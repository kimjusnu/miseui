import type * as React from "react"
import { useId, useRef, useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"
import { INLINE_FRAME_CLASS, TRIGGER_BASE_CLASS, TRIGGER_CLASS, type CascaderEffect, type CascaderLayout, type CascaderVariant } from "@/registry/miseui/ui/cascader-classes"
import { ColumnsView, StepsView } from "@/registry/miseui/ui/cascader-columns"
import { labelsFor, type CascaderOption, type CascaderPath } from "@/registry/miseui/ui/cascader-math"
import { SearchBox } from "@/registry/miseui/ui/cascader-search"
import { useCascaderState, useContainerNarrow, useViewportNarrow, type CascaderState, type LoadChildren } from "@/registry/miseui/ui/cascader-state"
import { cn } from "@/registry/miseui/lib/utils"

interface CascaderBaseProps extends Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "children"> {
  options: readonly CascaderOption[]
  /** `effect` slides between levels on phones, along the direction you moved. */
  effect?: CascaderEffect
  /** `auto` shows columns on wide screens and steps on phones. */
  layout?: CascaderLayout
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
  loadingText?: string
  errorText?: string
  backLabel?: string
  /** Fetches the children of an option marked `lazy` the first time it opens. A rejected promise shows a retry. */
  loadChildren?: LoadChildren
  /** Posts each chosen leaf value with the surrounding form. */
  name?: string
}

type CascaderSingleProps = CascaderBaseProps & {
  /** `plain` a field with a popover, `inline` the panel in the page, `compact` a tighter field and narrower columns, `multiple` tick many. */
  variant?: "plain" | "inline" | "compact"
  value?: CascaderPath | null
  defaultValue?: CascaderPath | null
  onValueChange?: (path: string[] | null) => void
}

type CascaderMultipleProps = CascaderBaseProps & {
  variant: "multiple"
  value?: readonly CascaderPath[]
  defaultValue?: readonly CascaderPath[]
  onValueChange?: (paths: string[][]) => void
}

type CascaderProps = CascaderSingleProps | CascaderMultipleProps

const toList = (props: CascaderProps, value: CascaderProps["value"]) => {
  if (value === null || value === undefined) return []
  return props.variant === "multiple" ? (value as readonly CascaderPath[]) : [value as CascaderPath]
}

function useConfiguredState(props: CascaderProps, inline: boolean) {
  const multiple = props.variant === "multiple"
  return useCascaderState({
    options: props.options,
    loadChildren: props.loadChildren,
    inline,
    multiple,
    controlled: props.value === undefined ? undefined : toList(props, props.value),
    initial: toList(props, props.defaultValue),
    emit: (next) => {
      if (props.variant === "multiple") props.onValueChange?.(next.map((path) => [...path]))
      else props.onValueChange?.(next[0] ? [...next[0]] : null)
    },
  })
}

/** Parents give way before the leaf: the last part is what was chosen, so it is the last to be cut. */
function PathText({ labels, placeholder }: { labels: readonly string[]; placeholder: string }) {
  if (labels.length === 0) return <span className="min-w-0 flex-1 truncate text-muted-foreground">{placeholder}</span>
  const parents = labels.slice(0, -1).join(" / ")
  return (
    <span data-slot="cascader-path" className="flex min-w-0 flex-1 items-baseline gap-1">
      {parents ? <span className="min-w-0 truncate text-muted-foreground">{parents} /</span> : null}
      <span className="max-w-full shrink-0 truncate">{labels[labels.length - 1]}</span>
    </span>
  )
}

function triggerLabels(state: CascaderState) {
  const [first, ...rest] = state.selected
  if (!first) return []
  const labels = labelsFor(state.resolved, first)
  if (rest.length === 0) return labels
  // Several picks: the leaves are what tell them apart, and the count says the rest exist.
  return [`${labels[labels.length - 1]} +${rest.length}`]
}

interface PanelProps {
  state: CascaderState
  props: CascaderProps
  variant: CascaderVariant
  stepped: boolean
  label: string
  inputRef: React.RefObject<HTMLInputElement | null>
}

function CascaderPanel({ state, props, variant, stepped, label, inputRef }: PanelProps) {
  const { effect, searchable = true, searchPlaceholder = "Search", emptyText = "No results.", loadingText = "Loading", errorText = "Could not load. Try again", backLabel = "Back" } = props
  const shared = { state, variant, label, searchable, loadingText, errorText, focusSearch: () => inputRef.current?.focus() }
  const searching = searchable && state.query !== ""
  return (
    <>
      {searchable ? <SearchBox state={state} variant={variant} placeholder={searchPlaceholder} emptyText={emptyText} inputRef={inputRef} /> : null}
      {searching ? null : stepped ? <StepsView {...shared} slide={effect === "slide"} backLabel={backLabel} /> : <ColumnsView {...shared} />}
    </>
  )
}

function usesSteps(layout: CascaderLayout, narrow: boolean) {
  if (layout === "auto") return narrow
  return layout === "steps"
}

function HiddenFields({ name, selected }: { name?: string; selected: readonly CascaderPath[] }) {
  if (!name) return null
  return selected.map((path) => <input key={path.join("/")} type="hidden" name={name} value={path[path.length - 1]} />)
}

function InlineCascader({ props, state, label, className }: { props: CascaderProps; state: CascaderState; label: string; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const narrow = useContainerNarrow(frame)
  const labels = labelsFor(state.resolved, state.selected[0] ?? [])
  return (
    <div data-slot="cascader" data-variant="inline" data-effect={props.effect} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)}>
      <HiddenFields name={props.name} selected={state.selected} />
      <p aria-live="polite" className="flex min-h-5 min-w-0 text-[13px] leading-5">
        <PathText labels={labels} placeholder={props.placeholder ?? "Nothing chosen yet"} />
      </p>
      <div ref={setFrame} className={INLINE_FRAME_CLASS}>
        <CascaderPanel state={state} props={props} variant="inline" stepped={usesSteps(props.layout ?? "auto", narrow)} label={label} inputRef={inputRef} />
      </div>
    </div>
  )
}

function PopoverCascader({ props, state, variant, label, trigger }: { props: CascaderProps; state: CascaderState; variant: Exclude<CascaderVariant, "inline">; label: string; trigger: React.ComponentProps<"button"> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const narrow = useViewportNarrow()
  const stepped = usesSteps(props.layout ?? "auto", narrow)
  const searchable = props.searchable ?? true
  const valueId = useId()
  const labels = triggerLabels(state)
  const { "aria-label": ariaLabel, "aria-labelledby": labelledBy, className: triggerClass, ...rest } = trigger
  // A name replaces a button's content, so the chosen path has to be added to it or it is never announced.
  const named = ariaLabel && labels.length > 0 ? `${ariaLabel}, ${labels.join(", ")}` : ariaLabel
  const labelled = labelledBy && labels.length > 0 ? `${labelledBy} ${valueId}` : labelledBy
  return (
    <div data-slot="cascader" data-variant={variant} data-effect={props.effect} className={cn("w-full min-w-0", props.className)}>
      <HiddenFields name={props.name} selected={state.selected} />
      <Popover open={state.open} onOpenChange={state.setOpen}>
        <PopoverTrigger data-slot="cascader-trigger" aria-label={named} aria-labelledby={labelled} className={cn(TRIGGER_BASE_CLASS, TRIGGER_CLASS[variant], triggerClass)} {...rest}>
          <span id={valueId} className="flex min-w-0 flex-1">
            <PathText labels={labels} placeholder={props.placeholder ?? "Select"} />
          </span>
          <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={label}
          className={cn("max-w-(--radix-popover-content-available-width) overflow-hidden p-0", stepped ? "w-(--radix-popover-trigger-width) min-w-64" : "w-auto")}
          onEscapeKeyDown={(event) => {
            // Radix listens on the document in the capture phase, ahead of the box, so the first Escape is caught here.
            if (state.query === "") return
            event.preventDefault()
            state.setQuery("")
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            // On a phone, focusing the box would raise the keyboard over the list people opened this to see.
            if (searchable && !stepped) inputRef.current?.focus()
            // Read from the panel itself: the tree in state only arrives with the next render.
            else (event.target as HTMLElement).querySelector<HTMLElement>("[role='treeitem'][tabindex='0']")?.focus()
          }}
        >
          <CascaderPanel state={state} props={props} variant={variant} stepped={stepped} label={label} inputRef={inputRef} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const OWN_PROPS: ReadonlySet<string> = new Set([
  "options", "variant", "effect", "layout", "placeholder", "searchable", "searchPlaceholder", "emptyText", "loadingText",
  "errorText", "backLabel", "loadChildren", "name", "value", "defaultValue", "onValueChange", "className",
])

function Cascader(props: CascaderProps) {
  const variant = props.variant ?? "plain"
  const state = useConfiguredState(props, variant === "inline")
  const label = props["aria-label"] ?? props.placeholder ?? "Options"
  if (variant === "inline") return <InlineCascader props={props} state={state} label={label} className={props.className} />
  const trigger = Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key))) as React.ComponentProps<"button">
  return <PopoverCascader props={props} state={state} variant={variant} label={label} trigger={trigger} />
}

export { Cascader, type CascaderProps, type CascaderOption, type CascaderPath, type CascaderVariant, type CascaderEffect, type CascaderLayout, type LoadChildren }
