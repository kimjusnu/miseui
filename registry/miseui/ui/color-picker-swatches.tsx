import type * as React from "react"
import { useId } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { normalizeHex } from "@/registry/miseui/ui/color-picker-math"
import { cn } from "@/registry/miseui/lib/utils"

type ColorSwatch = string | { value: string; label: string }

/** Checks drawn with theme tokens, so a see-through colour reads as see-through in light and dark. */
const CHECKER_BACKGROUND = "repeating-conic-gradient(var(--input) 0% 25%, var(--background) 0% 50%) 0 0 / 8px 8px"

const SWATCH_KEYS: Record<string, number | undefined> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

function swatchEntry(swatch: ColorSwatch) {
  const value = typeof swatch === "string" ? swatch : swatch.value
  return { value, hex: normalizeHex(value) ?? value, label: typeof swatch === "string" ? value : swatch.label }
}

interface SwatchProps {
  entry: ReturnType<typeof swatchEntry>
  selected: boolean
  tabStop: boolean
  disabled: boolean
  slide: boolean
  onPick: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
}

function Swatch({ entry, selected, tabStop, disabled, slide, onPick, onKeyDown }: SwatchProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={entry.label}
      disabled={disabled}
      tabIndex={tabStop ? 0 : -1}
      data-slot="color-picker-swatch"
      className={cn(
        "relative size-8 shrink-0 rounded-full outline-none pointer-coarse:size-10",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
      )}
      onClick={onPick}
      onKeyDown={onKeyDown}
    >
      <span aria-hidden="true" className="absolute inset-1 rounded-full ring-1 ring-foreground/10 ring-inset dark:ring-foreground/30" style={{ backgroundColor: entry.hex }} />
      {selected ? (
        <motion.span
          aria-hidden="true"
          data-slot="color-picker-swatch-ring"
          layoutId={slide ? "swatch-ring" : undefined}
          transition={SPRING_DEFAULT}
          className="absolute inset-0 rounded-full border-2 border-foreground"
        />
      ) : null}
    </button>
  )
}

interface SwatchGridProps {
  swatches: readonly ColorSwatch[]
  hex: string
  disabled: boolean
  spring: boolean
  label?: string
  className?: string
  onPick: (value: string) => void
}

/** Radio semantics, since one colour is chosen at a time: one tab stop, arrow keys move and select together. */
function SwatchGrid({ swatches, hex, disabled, spring, label = "Color presets", className, onPick }: SwatchGridProps) {
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const entries = swatches.map(swatchEntry)
  const selectedIndex = entries.findIndex((entry) => entry.hex === hex)
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset = SWATCH_KEYS[event.key]
    if (offset === undefined) return
    event.preventDefault()
    const next = (index + offset + entries.length) % entries.length
    onPick(entries[next].value)
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[role='radio']")[next]?.focus()
  }
  return (
    <LayoutGroup id={groupId}>
      <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} data-slot="color-picker-swatches" className={cn("flex flex-wrap gap-2", className)}>
        {entries.map((entry, index) => (
          <Swatch
            key={entry.value}
            entry={entry}
            selected={index === selectedIndex}
            // With nothing selected the first swatch keeps the group reachable by Tab.
            tabStop={index === selectedIndex || (selectedIndex === -1 && index === 0)}
            disabled={disabled}
            slide={spring && !reduceMotion}
            onPick={() => onPick(entry.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          />
        ))}
      </div>
    </LayoutGroup>
  )
}

export { CHECKER_BACKGROUND, SwatchGrid, type ColorSwatch }
