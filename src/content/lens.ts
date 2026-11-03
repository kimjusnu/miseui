import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "lens",
  title: "Lens",
  category: "interactions",
  description: "A magnifier over any content: a round lens, a lifted loupe, a zoomed panel beside it or a full-width band, with a second copy that focus and assistive tech never reach.",
  why: {
    principle: "Focus plus context",
    explanation:
      "Zooming a whole picture loses the picture. A lens enlarges one spot while the rest stays where it was, so people keep their bearings as they read the detail. The zoomed part is a real second copy of the content, so it stays sharp and needs no large image.",
    avoid:
      "Do not use it to make text readable that should simply be larger. Anything in the copy is shown, not used: a live widget inside would change on one side only. With `press`, a swipe that starts on the content does not scroll the page, so keep some page beside it on a phone.",
  },
  designs: [
    {
      name: "circle",
      principle: "Direct manipulation",
      use: "A picture to explore for its own sake, such as a map or an illustration, where the lens feels like a real glass on the pointer.",
    },
    {
      name: "square",
      principle: "Occlusion",
      use: "Precise inspection of a chart or a drawing: the loupe sits above the point it reads, so the cursor never covers the detail. A crosshair marks the spot and the zoom is written in the corner.",
    },
    {
      name: "panel",
      principle: "Overview first, details on demand",
      use: "A product page: the original stays whole, a frame shows what is being read, and the detail appears beside it, or below it on a narrow screen. The panel is never empty.",
    },
    {
      name: "strip",
      principle: "Reading gravity",
      use: "Lines of fine print or a dense table, where the eye moves along a row: the band keeps a whole line in view and moves only up and down.",
    },
  ],
  effects: [
    {
      name: "press",
      principle: "User control and freedom",
      use: "When the lens should appear only on purpose, and on touch, where a finger can then drag it. The page does not scroll for that gesture.",
    },
  ],
  usage: `import { Lens } from "@/components/ui/lens"

<Lens variant="circle" zoom={2}>
  <img src="/map.png" alt="Trail map of the north valley" />
</Lens>

<Lens variant="panel" zoom={3} defaultPoint={{ x: 0.5, y: 0.4 }}>
  <img src="/watch.png" alt="The watch from the front" />
</Lens>

<Lens variant="strip" effect="press" size={56}>
  <p className="text-xs">The full terms of the plan.</p>
</Lens>`,
  exports: ["Lens"],
}
