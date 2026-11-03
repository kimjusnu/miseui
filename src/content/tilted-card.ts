import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tilted-card",
  title: "Tilted Card",
  category: "interactions",
  description: "A showcase card with strong tilt and depth for a picture or a pass: a floating caption, a foil sheen, parts on separate planes or a notched ticket, with text sharp at rest.",
  why: {
    principle: "Object permanence",
    explanation:
      "Something that turns toward your hand reads as a real object you hold, which is why a ticket or a print feels worth having on a screen. The transform goes back to none whenever nobody is touching it, so its text is as sharp as the rest of the page, and nothing depends on the tilt.",
    avoid:
      "Do not use it for ordinary cards in a grid: twelve degrees on every card makes a page seasick, and Card with effect tilt is the right choice there. Keep it to one or two objects per screen, and never make the tilt the only way to see something.",
  },
  designs: [
    {
      name: "photo",
      principle: "Depth cue",
      use: "A hero picture or a cover: the caption floats above the picture when it turns, so the image gains a foreground without a redesign.",
    },
    {
      name: "glare",
      principle: "Material honesty",
      use: "A collectible or a membership card, where light moving across a surface says it is a thing with a finish. Neutral light, no rainbow.",
    },
    {
      name: "layers",
      principle: "Motion parallax",
      use: "A feature card with a few separate parts: planes moving apart show which part sits on top of which.",
    },
    {
      name: "pass",
      principle: "Familiarity",
      use: "A ticket, a boarding pass or a membership: the notched fold and fine print are read as a pass before any word is read.",
    },
  ],
  effects: [
    {
      name: "drag",
      principle: "Direct manipulation",
      use: "On a phone, where there is no hover: a finger holding the card tilts it, it settles on release, and a vertical swipe still scrolls the page.",
    },
  ],
  usage: `import { TiltedCard, TiltLayer } from "@/components/ui/tilted-card"

<TiltedCard variant="photo" caption="Evening ridge, 1,240 m" className="max-w-xs">
  <img src="/ridge.jpg" alt="A ridge line at dusk" />
</TiltedCard>

<TiltedCard variant="layers" effect="drag" className="max-w-xs">
  <div className="p-4">
    <TiltLayer depth={24}><h3>Morning brief</h3></TiltLayer>
    <TiltLayer depth={48}><span>8 min read</span></TiltLayer>
  </div>
</TiltedCard>

<TiltedCard variant="pass" stub="Row 4, seat 12" finePrint="Doors open at 18:30.">
  <h3>Design systems evening</h3>
</TiltedCard>`,
  exports: ["TiltedCard", "TiltLayer"],
}
