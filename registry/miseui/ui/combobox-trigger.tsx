import type * as React from "react"
import { useId } from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { PopoverAnchor, PopoverTrigger } from "@/registry/miseui/ui/popover"
import type { ComboboxOption } from "@/registry/miseui/ui/combobox-state"
import { cn } from "@/registry/miseui/lib/utils"

const FIELD_CLASS = [
  "rounded-md border border-input bg-transparent text-sm shadow-xs",
  "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
]
const FOCUS_CLASS = "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
const DISABLED_CLASS = "disabled:cursor-not-allowed disabled:opacity-50"

type TriggerProps = React.ComponentProps<typeof PopoverTrigger>

function summary(selected: readonly ComboboxOption[]) {
  if (selected.length < 2) return selected[0]?.label
  return `${selected[0].label} +${selected.length - 1}`
}

interface ComboboxTriggerProps extends TriggerProps {
  selected: readonly ComboboxOption[]
  placeholder: string
  showMedia: boolean
}

function ComboboxTrigger({
  selected,
  placeholder,
  showMedia,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: ComboboxTriggerProps) {
  const valueId = useId()
  const label = summary(selected)
  const media = showMedia ? selected[0]?.media : null
  return (
    <PopoverTrigger
      data-slot="combobox-trigger"
      // A name replaces a button's content, so the chosen value has to be added to it or it is never announced.
      aria-label={ariaLabel && label ? `${ariaLabel}, ${label}` : ariaLabel}
      aria-labelledby={labelledBy && label ? `${labelledBy} ${valueId}` : labelledBy}
      className={cn(
        FIELD_CLASS,
        FOCUS_CLASS,
        DISABLED_CLASS,
        "flex h-9 w-full items-center justify-between gap-2 px-3 text-left pointer-coarse:h-10",
        className,
      )}
      {...props}
    >
      {media ? (
        <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{media}</span>
      ) : null}
      <span id={valueId} className={cn("min-w-0 flex-1 truncate", !label && "text-muted-foreground")}>
        {label ?? placeholder}
      </span>
      <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  )
}

interface ComboboxTagsProps extends TriggerProps {
  selected: readonly ComboboxOption[]
  placeholder: string
  onRemove: (value: string) => void
}

function RemovableTag({ option, disabled, onRemove }: { option: ComboboxOption; disabled?: boolean; onRemove: (value: string) => void }) {
  return (
    <span className="flex h-7 max-w-full items-center rounded-sm bg-secondary pl-2 text-[13px] text-secondary-foreground">
      <span className="min-w-0 truncate">{option.label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Remove ${option.label}`}
        className="relative flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5"
        onClick={() => onRemove(option.value)}
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </span>
  )
}

/** Remove buttons cannot nest inside the trigger button, so the frame is an anchor holding both as siblings. */
function ComboboxTags({ selected, placeholder, onRemove, className, disabled, ...props }: ComboboxTagsProps) {
  return (
    <PopoverAnchor asChild>
      <div
        data-slot="combobox-tags"
        className={cn(
          FIELD_CLASS,
          "flex min-h-9 w-full flex-wrap items-center gap-1 p-1 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 pointer-coarse:min-h-10",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {selected.map((option) => (
          <RemovableTag key={option.value} option={option} disabled={disabled} onRemove={onRemove} />
        ))}
        <PopoverTrigger
          data-slot="combobox-trigger"
          disabled={disabled}
          className="flex h-7 min-w-24 flex-1 items-center justify-between gap-2 rounded-sm px-2 text-left text-muted-foreground outline-none disabled:cursor-not-allowed"
          {...props}
        >
          <span className="truncate">{placeholder}</span>
          <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
      </div>
    </PopoverAnchor>
  )
}

export { ComboboxTags, ComboboxTrigger }
