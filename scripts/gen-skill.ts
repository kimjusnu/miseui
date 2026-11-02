import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { ComponentMeta } from "../src/content/types"
import { formatLlmsTxt, formatReference, formatSkill } from "./skill-format"

const DEFAULT_SITE_URL = "https://miseui.pages.dev"
const NON_META_FILES = new Set(["index.ts", "types.ts"])

async function readComponentMetas(contentDir: string): Promise<ComponentMeta[]> {
  const files = readdirSync(contentDir).filter((file) => file.endsWith(".ts") && !NON_META_FILES.has(file))
  const metas = await Promise.all(
    files.map(async (file) => {
      const module = (await import(pathToFileURL(join(contentDir, file)).href)) as { meta?: ComponentMeta }
      if (!module.meta) throw new Error(`${file} does not export \`meta\``)
      return module.meta
    }),
  )
  return metas.sort((a, b) => a.title.localeCompare(b.title))
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url))
  const site = process.env.MISEUI_SITE_URL ?? DEFAULT_SITE_URL
  const components = await readComponentMetas(join(root, "src", "content"))

  const skillDir = join(root, "skills", "miseui")
  const referencesDir = join(skillDir, "references")
  rmSync(referencesDir, { recursive: true, force: true })
  mkdirSync(referencesDir, { recursive: true })

  writeFileSync(join(skillDir, "SKILL.md"), formatSkill(components, site))
  for (const meta of components) {
    writeFileSync(join(referencesDir, `${meta.name}.md`), formatReference(meta, site))
  }
  mkdirSync(join(root, "public"), { recursive: true })
  writeFileSync(join(root, "public", "llms.txt"), formatLlmsTxt(components, site))
}

const invokedDirectly = process.argv[1] ? basename(process.argv[1]) === "gen-skill.ts" : false
if (invokedDirectly) {
  main().catch((error: unknown) => {
    process.stderr.write(`gen-skill failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
