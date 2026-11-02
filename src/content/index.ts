import type { Category, ComponentMeta } from "./types"

const modules = import.meta.glob<{ meta: ComponentMeta }>("./*.ts", { eager: true })

const isMetaModule = (path: string) => !path.endsWith("/index.ts") && !path.endsWith("/types.ts")

export const components: readonly ComponentMeta[] = Object.entries(modules)
  .filter(([path]) => isMetaModule(path))
  .map(([, module]) => module.meta)
  .sort((a, b) => a.title.localeCompare(b.title))

export const byCategory = (category: Category) => components.filter((c) => c.category === category)

export const findComponent = (name: string) => components.find((c) => c.name === name)
