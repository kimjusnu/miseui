import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "materialize",
  title: "Materialize",
  category: "transitions",
  description:
    "A surface that arrives like a material coming into focus: slightly smaller, softer, from its anchor, and leaves the same way.",
  why: {
    principle: "Spatial consistency · materials",
    explanation:
      "A panel that merely fades in has no origin, so the eye has to search for it. Materialize grows the surface 4% from the control that opened it while its blur clears, so it reads as a real object arriving, and it exits along the same path so the user knows where it went.",
    avoid:
      "Do not use it for content that is already on screen or for every list item; reserve it for surfaces the user summoned (menus, popovers, sheets, AI result cards).",
  },
  usage: `import { Materialize } from "@/components/ui/materialize"

<Materialize show={open} origin="top left">
  <div className="rounded-2xl bg-card p-6">Summoned surface</div>
</Materialize>`,
  exports: ["Materialize"],
}
