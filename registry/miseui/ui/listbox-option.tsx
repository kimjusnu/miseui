import { Check } from "lucide-react"
import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { ListboxOption as ListboxOptionData } from "@/registry/miseui/ui/listbox-state"
import { cn } from "@/registry/miseui/lib/utils"

type ListboxVariant = "plain" | "check" | "card" | "compact"

const ROW_CLASS: Record<ListboxVariant, string> = {
  plain: "min-h-9 gap-2 rounded-md px-3 py-2 text-sm pointer-coarse:min-h-10",
  check: "min-h-9 gap-2 rounded-md px-3 py-2 text-sm pointer-coarse:min-h-10",
  card: "gap-3 rounded-lg border p-3 text-sm",
  compact: "min-h-8 gap-2 px-2 py-1 text-[13px] pointer-coarse:min-h-10",
}

/** On the row with no effect, on the flying highlight with `spring`, so both looks stay identical at rest. */
const SELECTED_CLASS: Record<ListboxVariant, string> = {
  plain: "bg-accent",
  check: "",
  card: "ring-2 ring-foreground ring-inset",
  compact: "bg-mise-soft",
}

const HOVER_CLASS: Record<ListboxVariant, string> = {
  plain: "hover:bg-accent/50",
  check: "hover:bg-accent",
  card: "hover:bg-accent/50",
  compact: "hover:bg-accent/50",
}

interface CheckMarkProps {
  multiple: boolean
  selected: boolean
}

function CheckMark({ multiple, selected }: CheckMarkProps) {
  if (multiple) {
    return (
      <span
        aria-hidden="true"
        data-slot="listbox-checkbox"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border border-input",
          selected && "border-mise bg-mise text-mise-foreground",
        )}
      >
        {selected ? <Check className="size-3" /> : null}
      </span>
    )
  }
  return <Check aria-hidden="true" data-slot="listbox-check" className={cn("ml-auto size-4 shrink-0", !selected && "invisible")} />
}

interface ListboxOptionRowProps {
  option: ListboxOptionData
  id: string
  variant: ListboxVariant
  multiple: boolean
  selected: boolean
  active: boolean
  spring: boolean
  reduceMotion: boolean
  onPick: (option: ListboxOptionData) => void
}

function ListboxOptionRow({ option, id, variant, multiple, selected, active, spring, reduceMotion, onPick }: ListboxOptionRowProps) {
  const showHighlight = spring && selected && SELECTED_CLASS[variant] !== ""
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      data-slot="listbox-option"
      data-active={active ? "true" : undefined}
      className={cn(
        "relative isolate flex cursor-default items-center text-left select-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        // Only while the list holds keyboard focus: a mouse user has no use for a second marker.
        "group-focus-visible/listbox:data-active:ring-[3px] group-focus-visible/listbox:data-active:ring-ring/50 group-focus-visible/listbox:data-active:ring-inset",
        ROW_CLASS[variant],
        option.disabled ? "cursor-not-allowed opacity-50" : HOVER_CLASS[variant],
        selected && !spring && SELECTED_CLASS[variant],
        selected && variant !== "check" && "font-medium",
      )}
      onClick={() => onPick(option)}
    >
      {showHighlight ? (
        <motion.span
          aria-hidden="true"
          data-slot="listbox-highlight"
          data-reduced={reduceMotion ? "true" : undefined}
          // Selections in a multiple list stay put, so only a single selection has somewhere to fly from.
          layoutId={multiple || reduceMotion ? undefined : "listbox-highlight"}
          initial={multiple && !reduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          className={cn("absolute inset-0 -z-10 rounded-[inherit]", SELECTED_CLASS[variant])}
        />
      ) : null}
      {variant === "check" && multiple ? <CheckMark multiple selected={selected} /> : null}
      {option.icon && variant !== "compact" ? <span aria-hidden="true" className="flex shrink-0 text-muted-foreground [&_svg]:size-4">{option.icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block break-words">{option.label}</span>
        {option.description && variant !== "compact" ? <span className="block text-[13px] font-normal break-words text-muted-foreground">{option.description}</span> : null}
      </span>
      {variant === "check" && !multiple ? <CheckMark multiple={false} selected={selected} /> : null}
    </div>
  )
}

export { ListboxOptionRow, type ListboxVariant }
