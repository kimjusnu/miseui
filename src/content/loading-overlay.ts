import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "loading-overlay",
  title: "Loading Overlay",
  category: "feedback",
  description: "Covers its parent while work runs, and only its parent. Waits before showing so fast answers never flash, and keeps layout and focus in place.",
  why: {
    principle: "Doherty threshold",
    explanation:
      "Answers under about 200 ms feel instant, and a spinner flashed at that speed makes a fast product feel slower. So nothing shows until the delay has passed, and once shown it stays long enough to read. Only one part of the page is blocked, so the rest stays usable while it waits.",
    avoid:
      "Do not cover content that can stay usable while it refreshes; `bar` exists for that. Do not use it for a first load with nothing behind it; a skeleton alone is simpler. Do not wrap a whole page, since that takes away everything at once.",
  },
  designs: [
    {
      name: "spinner",
      principle: "Visibility of system status",
      use: "When an action changed the data, such as saving a form or applying a filter, and old values should recede.",
    },
    {
      name: "blur",
      principle: "Figure and ground",
      use: "When the content underneath is private or stale, and it should look unavailable while the layout stays recognisable.",
    },
    {
      name: "skeleton",
      principle: "Perceived performance",
      use: "When whole rows will change, so the old content is hidden and the shape of what is coming takes its place.",
    },
    {
      name: "bar",
      principle: "Non-blocking feedback",
      use: "For background refreshes where the current numbers are still worth reading while new ones arrive.",
    },
  ],
  effects: [
    {
      name: "fade",
      principle: "Temporal continuity",
      use: "When the cover is large, so it eases in once the delay has passed instead of snapping over the content. Instant under reduced motion.",
    },
  ],
  usage: `import { LoadingOverlay } from "@/components/ui/loading-overlay"

<LoadingOverlay loading={isFetching} variant="blur" effect="fade" label="Refreshing orders" className="rounded-lg border">
  <OrdersTable rows={rows} />
</LoadingOverlay>`,
  exports: ["LoadingOverlay"],
}
