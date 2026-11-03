import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "aurora-background",
  title: "Aurora Background",
  category: "backgrounds",
  description: "Light with height and direction: curtains from the top, a glow from the bottom edge, a ring behind the centre or one diagonal ribbon, with an optional slow drift.",
  why: {
    principle: "Directional cue",
    explanation:
      "Mesh colour sits evenly in a box; aurora comes from somewhere. Light falling from the top or rising from the bottom gives a page a sense of space, and it steers the eye toward the words it leaves room for.",
    avoid:
      "Do not use it behind a form or a table, or more than once per page. Set body text in foreground, because muted foreground drops below 4.5:1 where the light is strongest. Pick mesh when you only want colour, without direction.",
  },
  designs: [
    { name: "curtain", principle: "Vertical rhythm", use: "In a tall hero with the heading in the lower half, under bands of light hanging from the top." },
    { name: "horizon", principle: "Depth cues", use: "Behind a heading above the fold or a closing call to action, with glow rising from the bottom edge like a sunrise." },
    { name: "halo", principle: "Focal point", use: "Behind one short statement or a logo in the centre, framed by a soft ring." },
    { name: "ribbon", principle: "Directional cue", use: "On a wide banner, where one diagonal band leads the eye across the text." },
  ],
  effects: [
    {
      name: "drift",
      principle: "Ambient motion",
      use: "In a hero people stay on: curtains sway, the halo turns and the ribbon slides, all too slowly to watch. Wire `paused` to a control.",
    },
  ],
  usage: `import { AuroraBackground } from "@/components/ui/aurora-background"

<AuroraBackground variant="curtain" className="rounded-xl py-24">
  <h1>Quiet tools for loud weeks</h1>
</AuroraBackground>

<AuroraBackground variant="halo" effect="drift" paused={paused}>…</AuroraBackground>`,
  exports: ["AuroraBackground"],
}
