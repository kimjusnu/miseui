import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { fileURLToPath } from "node:url"
import { DEFAULT_PALETTE, PALETTES, darkVars, lightVars, type Palette } from "../src/lib/palettes"

export interface RegistryItem {
  name: string
  type: string
  files: unknown[]
  [key: string]: unknown
}

interface RegistryInfo {
  name: string
  homepage: string
}

const SCHEMA_URL = "https://ui.shadcn.com/schema/registry.json"
const DEFAULT_SITE_URL = "https://miseui.junsu4621.workers.dev"

export function mergeRegistryItems(items: readonly RegistryItem[], info: RegistryInfo) {
  const names = items.map((item) => item.name)
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicates.length > 0) {
    throw new Error(`Duplicate registry item names: ${duplicates.join(", ")}`)
  }
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
  return { $schema: SCHEMA_URL, name: info.name, homepage: info.homepage, items: sorted }
}

const FONT_STACK = '"Geist Variable", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
const THEME_TOKENS = {
  "font-display": FONT_STACK,
  "ease-mise": "cubic-bezier(0.2, 0, 0, 1)",
  "ease-mise-out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "duration-fast": "150ms",
  "duration-base": "240ms",
  "duration-slow": "400ms",
  "color-mise": "var(--mise)",
  "color-mise-foreground": "var(--mise-foreground)",
  "color-mise-soft": "var(--mise-soft)",
}
/** Utilities several components rely on; installing a theme has to bring them along. */
const THEME_CSS = {
  "@utility text-display": {
    "font-family": "var(--font-display)",
    "font-weight": "600",
    "letter-spacing": "-0.03em",
    "line-height": "1.04",
  },
  "@utility text-title": {
    "font-family": "var(--font-display)",
    "font-weight": "600",
    "letter-spacing": "-0.02em",
    "line-height": "1.12",
  },
  "@utility material": {
    "background-color": "color-mix(in oklab, var(--background) 72%, transparent)",
    "backdrop-filter": "blur(20px) saturate(180%)",
    "-webkit-backdrop-filter": "blur(20px) saturate(180%)",
  },
}

export function themeItem(palette: Palette): RegistryItem & { name: string } {
  const isDefault = palette.name === DEFAULT_PALETTE
  return {
    name: isDefault ? "theme" : `theme-${palette.name}`,
    type: "registry:theme",
    title: `${palette.title} theme`,
    description: `${palette.mood} Complete tokens, motion included.`,
    cssVars: { theme: THEME_TOKENS, light: lightVars(palette), dark: darkVars(palette) },
    css: THEME_CSS,
    files: [],
  }
}

function writeThemeItems(dir: string) {
  PALETTES.forEach((palette) => {
    const item = themeItem(palette)
    writeFileSync(join(dir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}
`)
  })
}

function readItems(dir: string): RegistryItem[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as RegistryItem)
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url))
  const homepage = process.env.MISEUI_SITE_URL ?? DEFAULT_SITE_URL
  writeThemeItems(join(root, "registry", "items"))
  const items = readItems(join(root, "registry", "items"))
  const registry = mergeRegistryItems(items, { name: "miseui", homepage })
  writeFileSync(join(root, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`)
}

const invokedDirectly = process.argv[1] ? basename(process.argv[1]) === "build-registry.ts" : false
if (invokedDirectly) main()
