/**
 * The single source for every theme: the site's live picker and the registry's theme items are both
 * generated from this list. People who do not pick colours for a living should not have to: each palette
 * is a complete, tested set of decisions, including the neutrals and the corner radius.
 */

type Vars = Readonly<Record<string, string>>

interface Accent {
  mise: string
  miseForeground: string
  miseSoft: string
  ring: string
}

export interface Palette {
  name: string
  title: string
  /** What the palette says, in one line, for the picker. */
  mood: string
  radius: string
  /** Hue and chroma the neutrals lean toward. */
  neutralHue: number
  neutralChroma: number
  light: Accent
  dark: Accent
}

export const PALETTES: readonly Palette[] = [
  {
    name: "mise",
    title: "Mise",
    mood: "Warm amber on cool neutrals. Friendly and alive.",
    radius: "0.875rem",
    neutralHue: 270,
    neutralChroma: 0.004,
    light: { mise: "oklch(0.74 0.15 62)", miseForeground: "oklch(0.2 0.03 60)", miseSoft: "oklch(0.95 0.04 75)", ring: "oklch(0.72 0.14 62)" },
    dark: { mise: "oklch(0.78 0.15 65)", miseForeground: "oklch(0.18 0.03 60)", miseSoft: "oklch(0.3 0.05 65)", ring: "oklch(0.72 0.14 62)" },
  },
  {
    name: "ink",
    title: "Ink",
    mood: "No colour at all. Serious, for tools and documents.",
    radius: "0.5rem",
    neutralHue: 90,
    neutralChroma: 0.002,
    light: { mise: "oklch(0.24 0.004 90)", miseForeground: "oklch(0.985 0.002 90)", miseSoft: "oklch(0.94 0.003 90)", ring: "oklch(0.55 0.004 90)" },
    dark: { mise: "oklch(0.95 0.003 90)", miseForeground: "oklch(0.18 0.003 90)", miseSoft: "oklch(0.3 0.003 90)", ring: "oklch(0.7 0.004 90)" },
  },
  {
    name: "cobalt",
    title: "Cobalt",
    mood: "Saturated blue. Trustworthy, for finance and B2B.",
    radius: "0.75rem",
    neutralHue: 255,
    neutralChroma: 0.007,
    light: { mise: "oklch(0.52 0.2 258)", miseForeground: "oklch(0.985 0.005 258)", miseSoft: "oklch(0.94 0.03 258)", ring: "oklch(0.6 0.17 258)" },
    dark: { mise: "oklch(0.7 0.16 255)", miseForeground: "oklch(0.17 0.04 258)", miseSoft: "oklch(0.3 0.07 258)", ring: "oklch(0.65 0.15 255)" },
  },
  {
    name: "forest",
    title: "Forest",
    mood: "Deep green. Calm, for health, money and climate.",
    radius: "0.75rem",
    neutralHue: 160,
    neutralChroma: 0.006,
    light: { mise: "oklch(0.47 0.1 162)", miseForeground: "oklch(0.985 0.006 162)", miseSoft: "oklch(0.94 0.03 162)", ring: "oklch(0.55 0.1 162)" },
    dark: { mise: "oklch(0.74 0.13 162)", miseForeground: "oklch(0.18 0.03 162)", miseSoft: "oklch(0.3 0.05 162)", ring: "oklch(0.66 0.12 162)" },
  },
  {
    name: "ember",
    title: "Ember",
    mood: "Hot rose. Bold, for consumer and creative products.",
    radius: "1.125rem",
    neutralHue: 15,
    neutralChroma: 0.005,
    light: { mise: "oklch(0.58 0.21 15)", miseForeground: "oklch(0.985 0.006 15)", miseSoft: "oklch(0.95 0.03 15)", ring: "oklch(0.64 0.18 15)" },
    dark: { mise: "oklch(0.71 0.18 15)", miseForeground: "oklch(0.18 0.04 15)", miseSoft: "oklch(0.31 0.07 15)", ring: "oklch(0.66 0.17 15)" },
  },
]

export const DEFAULT_PALETTE = "mise"

const neutral = (lightness: number, palette: Palette, chromaScale = 1) =>
  `oklch(${lightness} ${Number((palette.neutralChroma * chromaScale).toFixed(4))} ${palette.neutralHue})`

const accentVars = (accent: Accent): Vars => ({
  mise: accent.mise,
  "mise-foreground": accent.miseForeground,
  "mise-soft": accent.miseSoft,
  ring: accent.ring,
})

export function lightVars(palette: Palette): Vars {
  const ink = neutral(0.21, palette)
  return {
    radius: palette.radius,
    background: neutral(0.995, palette, 0.25),
    foreground: ink,
    card: neutral(0.975, palette, 0.5),
    "card-foreground": ink,
    popover: neutral(0.995, palette, 0.25),
    "popover-foreground": ink,
    primary: ink,
    "primary-foreground": neutral(0.99, palette, 0.25),
    secondary: neutral(0.955, palette, 0.75),
    "secondary-foreground": ink,
    muted: neutral(0.965, palette, 0.5),
    "muted-foreground": neutral(0.5, palette, 2),
    accent: neutral(0.955, palette, 0.75),
    "accent-foreground": ink,
    destructive: "oklch(0.6 0.22 27)",
    border: neutral(0.9, palette, 0.75),
    input: neutral(0.9, palette, 0.75),
    ...accentVars(palette.light),
  }
}

export function darkVars(palette: Palette): Vars {
  const paper = neutral(0.96, palette, 0.5)
  return {
    background: neutral(0.14, palette, 1.25),
    foreground: paper,
    card: neutral(0.19, palette, 1.25),
    "card-foreground": paper,
    popover: neutral(0.2, palette, 1.25),
    "popover-foreground": paper,
    primary: paper,
    "primary-foreground": neutral(0.17, palette),
    secondary: neutral(0.24, palette, 1.25),
    "secondary-foreground": paper,
    muted: neutral(0.22, palette, 1.25),
    "muted-foreground": neutral(0.7, palette, 1.5),
    accent: neutral(0.26, palette, 1.25),
    "accent-foreground": paper,
    destructive: "oklch(0.7 0.19 22)",
    border: "oklch(1 0 0 / 12%)",
    input: "oklch(1 0 0 / 15%)",
    ...accentVars(palette.dark),
  }
}

const declarations = (vars: Vars) =>
  Object.entries(vars)
    .map(([name, value]) => `--${name}: ${value};`)
    .join(" ")

/**
 * Non-default palettes as CSS. `.dark` also appears on sections inside a light page, so the dark rule
 * must match descendants as well as the root, and must come after the light rule.
 */
export function paletteCss(palettes: readonly Palette[] = PALETTES) {
  return palettes
    .filter((palette) => palette.name !== DEFAULT_PALETTE)
    .map((palette) => {
      const root = `[data-palette="${palette.name}"]`
      return `${root} { ${declarations(lightVars(palette))} }\n${root}.dark, ${root} .dark { ${declarations(darkVars(palette))} }`
    })
    .join("\n")
}
