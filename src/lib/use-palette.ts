import { useCallback, useEffect, useState } from "react"
import { DEFAULT_PALETTE, PALETTES, paletteCss } from "./palettes"

const STORAGE_KEY = "miseui-palette"
const STYLE_ID = "miseui-palettes"

function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return PALETTES.some((palette) => palette.name === value) ? (value as string) : DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = paletteCss()
  document.head.append(style)
}

/** Palette choice for this site's own preview. Installed projects pick theirs with a registry item instead. */
export function usePalette() {
  const [palette, setPaletteState] = useState(readStored)

  useEffect(() => {
    ensureStyles()
    document.documentElement.dataset.palette = palette
  }, [palette])

  const setPalette = useCallback((next: string) => {
    setPaletteState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage: the choice still applies for this visit.
    }
  }, [])

  return { palette, setPalette }
}
