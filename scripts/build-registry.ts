import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { fileURLToPath } from "node:url"

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

function readItems(dir: string): RegistryItem[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as RegistryItem)
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url))
  const homepage = process.env.MISEUI_SITE_URL ?? DEFAULT_SITE_URL
  const items = readItems(join(root, "registry", "items"))
  const registry = mergeRegistryItems(items, { name: "miseui", homepage })
  writeFileSync(join(root, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`)
}

const invokedDirectly = process.argv[1] ? basename(process.argv[1]) === "build-registry.ts" : false
if (invokedDirectly) main()
