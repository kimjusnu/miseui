import type * as React from "react"
import { useState } from "react"
import { hexToHsva, hsvaToCss, normalizeHex } from "@/registry/miseui/ui/color-picker-math"
import { ColorArea, ColorTrack } from "@/registry/miseui/ui/color-picker-drag"
import { CHECKER_BACKGROUND, SwatchGrid, type ColorSwatch } from "@/registry/miseui/ui/color-picker-swatches"
import type { ColorState } from "@/registry/miseui/ui/color-picker-state"
import { cn } from "@/registry/miseui/lib/utils"

const HUE_BACKGROUND = "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"
const HUE_MAX = 360
const ALPHA_MAX = 100

type HexFieldProps = Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  hex: string
  onCommit: (hex: string) => void
}

/** Holds half-typed text as a draft: #25 is not a colour yet, and the picker must not jump while someone is on the way to #2563eb. */
function HexField({ hex, onCommit, className, ...props }: HexFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && normalizeHex(draft) === null
  const commit = () => {
    if (draft === null) return
    const normalized = normalizeHex(draft)
    if (normalized) onCommit(normalized)
    setDraft(null)
  }
  return (
    <input
      type="text"
      spellCheck={false}
      autoComplete="off"
      aria-label="Hex color"
      aria-invalid={invalid || undefined}
      data-slot="color-picker-hex"
      value={draft ?? hex}
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2 font-mono text-[13px] outline-none pointer-coarse:h-10",
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
        }
        if (event.key === "Escape") setDraft(null)
      }}
      {...props}
    />
  )
}

interface ColorPanelProps {
  state: ColorState
  alpha: boolean
  spring: boolean
  disabled: boolean
  swatches: readonly ColorSwatch[]
  /** The compact variant already has the hex field outside the panel. */
  showHex: boolean
}

function ColorPanel({ state, alpha, spring, disabled, swatches, showHex }: ColorPanelProps) {
  const { color, hex, update } = state
  const opaque = hsvaToCss({ ...color, a: 1 })
  const shared = { disabled, spring }
  const pickHex = (text: string) => {
    const parsed = hexToHsva(text)
    if (parsed) update(parsed)
  }
  return (
    <div data-slot="color-picker-panel" className="grid gap-4 pointer-coarse:gap-6">
      <ColorArea hue={color.h} saturation={color.s} brightness={color.v} thumbColor={opaque} onChange={(s, v) => update({ s, v })} {...shared} />
      <ColorTrack
        slot="color-picker-hue"
        label="Hue"
        value={color.h}
        max={HUE_MAX}
        valueText={`${Math.round(color.h)} degrees`}
        background={HUE_BACKGROUND}
        thumbColor={`hsl(${color.h} 100% 50%)`}
        onChange={(h) => update({ h })}
        {...shared}
      />
      {alpha ? (
        <ColorTrack
          slot="color-picker-alpha"
          label="Opacity"
          value={color.a * ALPHA_MAX}
          max={ALPHA_MAX}
          valueText={`${Math.round(color.a * ALPHA_MAX)}%`}
          background={`linear-gradient(to right, transparent, ${opaque}), ${CHECKER_BACKGROUND}`}
          thumbColor={opaque}
          onChange={(percent) => update({ a: percent / ALPHA_MAX })}
          {...shared}
        />
      ) : null}
      {showHex ? <HexField hex={hex} disabled={disabled} onCommit={pickHex} /> : null}
      {swatches.length > 0 ? <SwatchGrid swatches={swatches} hex={hex} disabled={disabled} spring={spring} onPick={pickHex} /> : null}
    </div>
  )
}

export { ColorPanel, HexField }
