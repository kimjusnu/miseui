import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "beam-border",
  title: "Beam Border",
  category: "effects",
  description:
    "One beam of light travelling the border of the surface the model is working on, so the eye knows where to wait.",
  why: {
    principle: "Selective attention",
    explanation:
      "A page with several cards gives no clue which one the model is filling. A single beam circling one border pulls attention to that surface and nowhere else, and its steady lap says the work is still going. The rest of the border stays the ordinary border colour so the card keeps its shape.",
    avoid:
      "Never run it on two surfaces at once; two beams cancel the signal. Do not use it as decoration on a static card, and switch it off the moment the content lands.",
  },
  usage: `import { BeamBorder } from "@/components/ui/beam-border"

<BeamBorder active={isGenerating} className="rounded-xl">
  <Card>…</Card>
</BeamBorder>

<BeamBorder duration={6} size={160} color="foreground" className="rounded-2xl">
  <Card>…</Card>
</BeamBorder>`,
  exports: ["BeamBorder"],
}
