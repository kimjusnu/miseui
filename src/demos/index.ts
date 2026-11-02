import type { ComponentType } from "react"

const modules = import.meta.glob<{ Demo: ComponentType }>("./*.tsx", { eager: true })

const nameFromPath = (path: string) => path.replace("./", "").replace(".tsx", "")

export const demos: Readonly<Record<string, ComponentType>> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [nameFromPath(path), module.Demo]),
)
