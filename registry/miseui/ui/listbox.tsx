import type * as React from "react"
import { useId, useRef } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { ListboxOptionRow, type ListboxVariant } from "@/registry/miseui/ui/listbox-option"
import { useListboxState, type ListboxGroup, type ListboxOption, type ListboxState } from "@/registry/miseui/ui/listbox-state"
import { cn } from "@/registry/miseui/lib/utils"

type ListboxEffect = "spring"

const ROOT_CLASS: Record<ListboxVariant, string> = {
  plain: "gap-1",
  check: "gap-1",
  card: "gap-2",
  compact: "rounded-md border divide-y",
}

type RootAttributes = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "onChange" | "onKeyDown" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>

interface ListboxBaseProps extends RootAttributes {
  options: readonly ListboxOption[]
  /** `plain` filled rows, `check` a trailing check or checkboxes, `card` bordered choices, `compact` dense ruled rows. */
  variant?: ListboxVariant
  /** `spring` slides one highlight between options when a single selection changes. */
  effect?: ListboxEffect
  disabled?: boolean
  /** Posts the selection with the surrounding form. */
  name?: string
}

type ListboxSingleProps = ListboxBaseProps & {
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
}

type ListboxMultipleProps = ListboxBaseProps & {
  multiple: true
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
}

type ListboxProps = ListboxSingleProps | ListboxMultipleProps

function toArray(value: string | readonly string[] | null | undefined) {
  if (value === null || value === undefined) return []
  return typeof value === "string" ? [value] : value
}

interface ListboxGroupViewProps {
  group: ListboxGroup
  variant: ListboxVariant
  multiple: boolean
  spring: boolean
  reduceMotion: boolean
  state: ListboxState
}

function ListboxGroupView({ group, variant, multiple, spring, reduceMotion, state }: ListboxGroupViewProps) {
  const labelId = useId()
  const rows = group.options.map((option) => (
    <ListboxOptionRow
      key={option.value}
      option={option}
      id={state.optionDomId(option.value)}
      variant={variant}
      multiple={multiple}
      selected={state.selected.includes(option.value)}
      active={state.active?.value === option.value}
      spring={spring}
      reduceMotion={reduceMotion}
      onPick={state.pick}
    />
  ))
  if (group.name === null) return rows
  return (
    <div role="group" aria-labelledby={labelId} className={cn("grid", variant === "compact" ? "divide-y" : ROOT_CLASS[variant])}>
      <div id={labelId} role="presentation" className="px-3 pt-2 pb-1 text-[13px] text-muted-foreground">{group.name}</div>
      {rows}
    </div>
  )
}

/** Everything else on the props is a div attribute and goes on the list, which is what a Field needs. */
const OWN_PROPS: ReadonlySet<string> = new Set(["options", "variant", "effect", "disabled", "name", "multiple", "value", "defaultValue", "onValueChange", "className"])

function rootAttributes(props: ListboxProps) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key))) as RootAttributes
}

function Listbox(props: ListboxProps) {
  const { options, variant = "plain", effect, disabled = false, name, className } = props
  const multiple = props.multiple === true
  const groupId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const controlled = props.value === undefined ? undefined : toArray(props.value)
  const emit = (next: readonly string[]) => {
    if (props.multiple) props.onValueChange?.([...next])
    else if (next[0] !== undefined) props.onValueChange?.(next[0])
  }
  const state = useListboxState({ options, multiple, disabled, controlled, initial: toArray(props.defaultValue), emit }, listRef)
  return (
    <LayoutGroup id={groupId}>
      {name ? state.selected.map((entry) => <input key={entry} type="hidden" name={name} value={entry} />) : null}
      {/* layoutScroll, or the highlight would start its flight from where the row sat before the list was scrolled. */}
      <motion.div
        ref={listRef}
        layoutScroll
        role="listbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiselectable={multiple || undefined}
        aria-disabled={disabled || undefined}
        aria-activedescendant={!disabled && state.active ? state.optionDomId(state.active.value) : undefined}
        data-slot="listbox"
        data-variant={variant}
        data-effect={effect}
        className={cn("group/listbox grid min-w-0 overflow-y-auto outline-none", ROOT_CLASS[variant], disabled && "pointer-events-none opacity-50", className)}
        onKeyDown={disabled ? undefined : state.onKeyDown}
        {...rootAttributes(props)}
      >
        {state.groups.map((group) => (
          <ListboxGroupView key={group.name ?? ""} group={group} variant={variant} multiple={multiple} spring={effect === "spring"} reduceMotion={reduceMotion} state={state} />
        ))}
      </motion.div>
    </LayoutGroup>
  )
}

export { Listbox, type ListboxProps, type ListboxOption, type ListboxVariant, type ListboxEffect }
