import type * as React from "react"
import { useId, useRef } from "react"
import { Search } from "lucide-react"
import { LayoutGroup, useReducedMotion } from "motion/react"
import { Popover, PopoverContent } from "@/registry/miseui/ui/popover"
import { ComboboxList, optionId } from "@/registry/miseui/ui/combobox-list"
import { useComboboxState, type ComboboxOption } from "@/registry/miseui/ui/combobox-state"
import { ComboboxTags, ComboboxTrigger } from "@/registry/miseui/ui/combobox-trigger"
import { cn } from "@/registry/miseui/lib/utils"

type ComboboxVariant = "plain" | "avatar" | "grouped" | "tags"
type ComboboxEffect = "spring" | "materialize"

type TriggerAttributes = Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children">

interface ComboboxBaseProps extends TriggerAttributes {
  options: readonly ComboboxOption[]
  /** `plain` rows, `avatar` media and description, `grouped` section headers, `tags` chips in the trigger. */
  variant?: ComboboxVariant
  /** `spring` slides one highlight between rows; `materialize` grows the panel out of the trigger. */
  effect?: ComboboxEffect
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: React.ReactNode
  loading?: boolean
  loadingText?: string
  /** Hands filtering to you: fires on every keystroke and with "" on close. Debounce it on your side. */
  onSearch?: (query: string) => void
  /** Posts the value with the surrounding form. */
  name?: string
}

type ComboboxSingleProps = ComboboxBaseProps & {
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

type ComboboxMultipleProps = ComboboxBaseProps & {
  multiple: true
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
}

type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps

/** Everything else on the props is a button attribute and goes to the trigger, which is what a Field needs. */
const OWN_PROPS: ReadonlySet<string> = new Set([
  "options", "variant", "effect", "placeholder", "searchPlaceholder", "emptyText", "loading", "loadingText",
  "onSearch", "name", "multiple", "value", "defaultValue", "onValueChange", "className",
])

function triggerAttributes(props: ComboboxProps) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key))) as TriggerAttributes
}

function toArray(value: string | readonly string[] | null | undefined) {
  if (value === null || value === undefined) return []
  return typeof value === "string" ? [value] : value
}

function useCombobox(props: ComboboxProps) {
  const { options, variant, value, defaultValue, onSearch } = props
  return useComboboxState({
    options,
    controlled: value === undefined ? undefined : toArray(value),
    initial: toArray(defaultValue),
    multiple: props.multiple === true,
    grouped: variant === "grouped",
    removeOnBackspace: variant === "tags",
    serverFiltered: onSearch !== undefined,
    onSearch,
    emit: (next) => {
      if (props.multiple) props.onValueChange?.([...next])
      else props.onValueChange?.(next[0] ?? null)
    },
  })
}

type ComboboxState = ReturnType<typeof useCombobox>

interface ComboboxPanelProps {
  state: ComboboxState
  props: ComboboxProps
  variant: ComboboxVariant
}

function ComboboxPanel({ state, props, variant }: ComboboxPanelProps) {
  const { effect, searchPlaceholder = "Search", emptyText = "No results.", loading = false, loadingText = "Loading" } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const activeIndex = state.active ? state.visible.indexOf(state.active) : -1
  return (
    <PopoverContent
      effect={effect === "materialize" ? "materialize" : undefined}
      align="start"
      aria-label={props["aria-label"]}
      className="w-(--radix-popover-trigger-width) max-w-(--radix-popover-content-available-width) min-w-64 p-0"
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        inputRef.current?.focus()
      }}
    >
      <div className="flex items-center gap-2 border-b px-3">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          role="combobox"
          aria-label={searchPlaceholder}
          aria-expanded={state.open}
          aria-controls={state.listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(state.listId, activeIndex) : undefined}
          autoComplete="off"
          placeholder={searchPlaceholder}
          value={state.query}
          className="h-10 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          onChange={(event) => state.onQueryChange(event.target.value)}
          onKeyDown={state.onInputKeyDown}
        />
      </div>
      <ComboboxList
        {...{ loading, loadingText, emptyText, reduceMotion }}
        {...{ listId: state.listId, groups: state.groups, visible: state.visible, active: state.active, selected: state.selected }}
        label={props["aria-label"]}
        multiple={props.multiple === true}
        rich={variant === "avatar"}
        spring={effect === "spring"}
        onHover={state.setActiveValue}
        onPick={state.toggle}
      />
    </PopoverContent>
  )
}

function Combobox(props: ComboboxProps) {
  const { variant = "plain", effect, placeholder = "Select", name, className } = props
  const state = useCombobox(props)
  // layoutId is global to the page; without a per-instance group two open lists would share one highlight.
  const groupId = useId()
  const trigger = triggerAttributes(props)
  return (
    <div data-slot="combobox" data-variant={variant} data-effect={effect} className={cn("w-full min-w-0", className)}>
      {name ? state.selected.map((entry) => <input key={entry} type="hidden" name={name} value={entry} />) : null}
      <Popover open={state.open} onOpenChange={state.setOpen}>
        {variant === "tags" ? (
          <ComboboxTags selected={state.selectedOptions} placeholder={placeholder} onRemove={state.remove} {...trigger} />
        ) : (
          <ComboboxTrigger selected={state.selectedOptions} placeholder={placeholder} showMedia={variant === "avatar"} {...trigger} />
        )}
        <LayoutGroup id={groupId}>
          <ComboboxPanel state={state} props={props} variant={variant} />
        </LayoutGroup>
      </Popover>
    </div>
  )
}

export { Combobox, type ComboboxProps, type ComboboxOption, type ComboboxVariant, type ComboboxEffect }
