import { lazy, type ComponentType, type LazyExoticComponent } from "react"

/** Only block demos read `variant`; the block preview passes it to choose a design. */
type DemoComponent = ComponentType<{ variant?: string }>

/** Lazy, because every page was paying for every demo and the kit keeps growing. Render inside Suspense. */
const loaders = import.meta.glob<{ Demo: DemoComponent }>("./*.tsx")

const nameFromPath = (path: string) => path.replace("./", "").replace(".tsx", "")

export const demos: Readonly<Record<string, LazyExoticComponent<DemoComponent>>> = Object.fromEntries(
  Object.entries(loaders).map(([path, load]) => [
    nameFromPath(path),
    lazy(() => load().then((module) => ({ default: module.Demo }))),
  ]),
)
