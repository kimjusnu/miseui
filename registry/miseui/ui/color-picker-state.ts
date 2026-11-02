import { useMemo, useState } from "react"
import { hexToHsva, hsvaToHex, type Hsva } from "@/registry/miseui/ui/color-picker-math"

const FALLBACK_HEX = "#2563eb"
const FALLBACK_COLOR: Hsva = { h: 0, s: 0, v: 0, a: 1 }

interface ColorStateOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  alpha: boolean
}

/**
 * The state is HSV and not hex because black has no hue: dragging the square into a corner and back
 * must not throw the hue bar to red. The owner's hex only wins when it names a different colour.
 */
function useColorState({ value, defaultValue = FALLBACK_HEX, onValueChange, alpha }: ColorStateOptions) {
  const [internal, setInternal] = useState<Hsva>(() => hexToHsva(value ?? defaultValue) ?? FALLBACK_COLOR)
  const color = useMemo(() => {
    const parsed = value === undefined ? null : hexToHsva(value)
    if (!parsed || hsvaToHex(parsed) === hsvaToHex(internal)) return internal
    return parsed
  }, [value, internal])
  const hex = hsvaToHex(color)

  const update = (patch: Partial<Hsva>) => {
    const next = { ...color, ...patch, a: alpha ? (patch.a ?? color.a) : 1 }
    setInternal(next)
    const nextHex = hsvaToHex(next)
    if (nextHex !== hex) onValueChange?.(nextHex)
  }

  return { color, hex, update }
}

type ColorState = ReturnType<typeof useColorState>

export { useColorState, type ColorState }
