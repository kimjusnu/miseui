import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "floating-panel",
  title: "Floating Panel",
  category: "overlays",
  description: "A movable, resizable window that stays on screen, for tools people keep open beside their work.",
  why: {
    principle: "User control and freedom",
    explanation:
      "When a tool has to stay open beside the work, only the person using it knows what it must not cover. Letting them move, shrink and tuck it away means the interface never has to guess, and clamping to the edges means it can never be lost off screen.",
    avoid:
      "Do not use it for a decision that needs an answer before anything else can happen; that is a dialog. On a phone there is rarely room to float anything, so prefer a drawer there.",
  },
  designs: [
    {
      name: "panel",
      principle: "Familiarity",
      use: "The default for an inspector or a preview: a titled window people already know how to handle.",
    },
    {
      name: "compact",
      principle: "Signal to noise ratio",
      use: "For small readouts such as a colour value or a log, where chrome should not outweigh the few lines inside.",
    },
    {
      name: "docked",
      principle: "Fitts's law",
      use: "When the panel should hold an edge at full height instead of covering the middle. Drag it across and it takes the nearer side.",
    },
    {
      name: "tool",
      principle: "Proximity",
      use: "For a palette of icon tools that belongs next to the canvas: a grip and the tools, with no title taking up room.",
    },
  ],
  effects: [
    {
      name: "momentum",
      principle: "Momentum projection",
      use: "On large canvases where people throw panels out of the way: it travels on from a flick and comes to rest inside the edges.",
    },
  ],
  usage: `import { FloatingPanel } from "@/components/ui/floating-panel"

// Floats over the viewport.
<FloatingPanel title="Layers" defaultPosition={{ x: 24, y: 24 }}>…</FloatingPanel>

// Stays inside a positioned element.
const stage = useRef(null)
<div ref={stage} className="relative h-96">
  <FloatingPanel title="Tools" variant="tool" boundary={stage} effect="momentum">…</FloatingPanel>
</div>`,
  exports: ["FloatingPanel"],
}
