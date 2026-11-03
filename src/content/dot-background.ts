import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "dot-background",
  title: "Dot Background",
  category: "backgrounds",
  description: "Small marks behind your content: an even dot field, a fading one, plus marks or a halftone growing toward one corner, with an optional colour around the pointer.",
  why: {
    principle: "Figure and ground",
    explanation:
      "Dots carry less ink than lines, so they texture a panel while staying further behind the text. Sparse marks suggest a working surface, like graph paper, and the sentence on top keeps every bit of attention.",
    avoid:
      "Do not use small marks behind small text in a tight space, because a dot and a full stop look alike. Change the spacing before raising the contrast, and do not stack it with another background.",
  },
  designs: [
    { name: "dots", principle: "Law of similarity", use: "Behind empty states and canvases, where an even field reads as a surface ready for work." },
    { name: "fade", principle: "Focal point", use: "Behind a centred message, where the field dissolves toward the edges and leaves no hard box." },
    { name: "plus", principle: "Signal over noise", use: "On technical or editorial pages, where small registration marks feel more deliberate than dots." },
    { name: "halftone", principle: "Gradient of size", use: "In a section with text on the left: dot size carries the eye toward the top right and is gone by the far corner." },
  ],
  effects: [
    {
      name: "pointer",
      principle: "Direct manipulation",
      use: "On a hero people move across, where marks taking the accent colour under the pointer show the surface is live. It stays off on touch.",
    },
  ],
  usage: `import { DotBackground } from "@/components/ui/dot-background"

<DotBackground variant="fade" className="rounded-xl border py-24">
  <h2>Nothing on this board yet</h2>
</DotBackground>

// Spacing of dots and fade comes from a custom property.
<DotBackground effect="pointer" className="[--mise-dot-cell:24px]">…</DotBackground>`,
  exports: ["DotBackground", "halftoneBuckets"],
}
