import type * as React from "react"
import { hexToHsva, hsvaToCss } from "@/registry/miseui/ui/color-picker-math"
import { ColorPanel, HexField } from "@/registry/miseui/ui/color-picker-panel"
import { useColorState, type ColorState } from "@/registry/miseui/ui/color-picker-state"
import { CHECKER_BACKGROUND, SwatchGrid, type ColorSwatch } from "@/registry/miseui/ui/color-picker-swatches"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"
import { cn } from "@/registry/miseui/lib/utils"

type ColorPickerVariant = "popover" | "inline" | "swatches" | "compact"
type ColorPickerEffect = "spring"

const DEFAULT_SWATCHES: readonly ColorSwatch[] = [
  { value: "#18181b", label: "Ink" },
  { value: "#64748b", label: "Slate" },
  { value: "#2563eb", label: "Blue" },
  { value: "#0d9488", label: "Teal" },
  { value: "#16a34a", label: "Green" },
  { value: "#d97706", label: "Amber" },
  { value: "#e11d48", label: "Rose" },
  { value: "#7c3aed", label: "Violet" },
]

const PANEL_POPOVER_CLASS = "w-64 max-w-(--radix-popover-content-available-width) p-4"

type ColorPickerProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** Hex: #rrggbb, or #rrggbbaa when see-through. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** `popover` a swatch button opens it, `inline` always open, `swatches` presets only, `compact` typed hex beside a swatch. */
  variant?: ColorPickerVariant
  /** `spring` eases the thumb when a click jumps it. A drag always follows the pointer exactly. */
  effect?: ColorPickerEffect
  /** Shows the opacity slider. Turned off, every colour stays opaque. */
  alpha?: boolean
  /** Presets, as a hex or `{ value, label }`. Pass an empty list to hide them. */
  swatches?: readonly ColorSwatch[]
  disabled?: boolean
  /** Posts the hex with the surrounding form. */
  name?: string
  /** Names the trigger or the preset group. */
  label?: string
}

function ColorSample({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="color-picker-sample"
      className={cn("relative block size-5 shrink-0 overflow-hidden rounded-sm", className)}
      style={{ background: CHECKER_BACKGROUND }}
    >
      <span className="absolute inset-0 ring-1 ring-foreground/10 ring-inset" style={{ backgroundColor: color }} />
    </span>
  )
}

interface VariantProps {
  state: ColorState
  alpha: boolean
  spring: boolean
  disabled: boolean
  swatches: readonly ColorSwatch[]
  label: string
}

function PopoverVariant({ state, alpha, spring, disabled, swatches, label }: VariantProps) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={`${label}: ${state.hex}`}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-input px-2 shadow-xs outline-none pointer-coarse:h-10",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <ColorSample color={hsvaToCss(state.color)} />
        <span className="font-mono text-[13px]">{state.hex}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className={PANEL_POPOVER_CLASS}>
        <ColorPanel state={state} alpha={alpha} spring={spring} disabled={disabled} swatches={swatches} showHex />
      </PopoverContent>
    </Popover>
  )
}

function CompactVariant({ state, alpha, spring, disabled, swatches, label }: VariantProps) {
  const pickHex = (text: string) => {
    const parsed = hexToHsva(text)
    if (parsed) state.update(parsed)
  }
  return (
    <div className="flex w-full max-w-44 min-w-0 items-center gap-2">
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          aria-label={`${label}: ${state.hex}`}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-md outline-none hover:bg-accent pointer-coarse:size-10",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <ColorSample color={hsvaToCss(state.color)} />
        </PopoverTrigger>
        <PopoverContent align="start" className={PANEL_POPOVER_CLASS}>
          <ColorPanel state={state} alpha={alpha} spring={spring} disabled={disabled} swatches={swatches} showHex={false} />
        </PopoverContent>
      </Popover>
      <HexField hex={state.hex} disabled={disabled} onCommit={pickHex} />
    </div>
  )
}

function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  variant = "popover",
  effect,
  alpha = true,
  swatches = DEFAULT_SWATCHES,
  disabled = false,
  name,
  label = "Color",
  className,
  ...props
}: ColorPickerProps) {
  const state = useColorState({ value, defaultValue, onValueChange, alpha })
  const spring = effect === "spring"
  const shared = { state, alpha, spring, disabled, swatches, label }
  return (
    <div data-slot="color-picker" data-variant={variant} data-effect={effect} className={cn("min-w-0", className)} {...props}>
      {name ? <input type="hidden" name={name} value={state.hex} disabled={disabled} /> : null}
      {variant === "popover" ? <PopoverVariant {...shared} /> : null}
      {variant === "compact" ? <CompactVariant {...shared} /> : null}
      {variant === "inline" ? (
        <div className="w-full max-w-64 rounded-lg border bg-card p-4">
          <ColorPanel state={state} alpha={alpha} spring={spring} disabled={disabled} swatches={swatches} showHex />
        </div>
      ) : null}
      {variant === "swatches" ? (
        <SwatchGrid
          swatches={swatches}
          hex={state.hex}
          disabled={disabled}
          spring={spring}
          label={label}
          onPick={(text) => {
            const parsed = hexToHsva(text)
            if (parsed) state.update(parsed)
          }}
        />
      ) : null}
    </div>
  )
}

export { ColorPicker, type ColorPickerProps, type ColorPickerVariant, type ColorPickerEffect, type ColorSwatch }
