import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/** Lazy, because every page was paying for every demo and the kit keeps growing. Render inside Suspense. */
const loaders = import.meta.glob<{ Demo: ComponentType }>("./*.tsx")

const nameFromPath = (path: string) => path.replace("./", "").replace(".tsx", "")

export const demos: Readonly<Record<string, LazyExoticComponent<ComponentType>>> = Object.fromEntries(
  Object.entries(loaders).map(([path, load]) => [
    nameFromPath(path),
    lazy(() => load().then((module) => ({ default: module.Demo }))),
  ]),
)
