import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "particles-background",
  title: "Particles Background",
  category: "backgrounds",
  description: "Points on one canvas behind a section: floating, joined by faint lines, rising, or an even field with a clearing that follows the pointer.",
  why: {
    principle: "Law of common fate",
    explanation:
      "Points moving together read as one soft surface instead of many things to look at. One canvas holds them, the count follows the area with a ceiling, and the loop stops off screen, so a busy-looking background stays cheap and out of the way.",
    avoid:
      "Do not use it to suggest data that is not there, and do not put it behind long reading. A constellation behind a network product is on topic; behind a pricing table it is noise.",
  },
  designs: [
    {
      name: "drift",
      principle: "Figure and ground",
      use: "A plain section that needs a little depth and nothing to read.",
    },
    {
      name: "constellation",
      principle: "Law of connectedness",
      use: "A product about networks, teams or links, where the lines say what the product does.",
    },
    {
      name: "rise",
      principle: "Direction of motion",
      use: "A closing section or a success page, since things going up and fading feel light and finished.",
    },
    {
      name: "field",
      principle: "Figure and ground",
      use: "A hero with one sentence: at rest the dots leave a clearing behind it, and the clearing follows the pointer. It costs nothing while it rests.",
    },
  ],
  effects: [
    {
      name: "pointer",
      principle: "Direct manipulation",
      use: "Where a pointer is likely to rest on the section: drift points part around it and the constellation links to it. Off on touch; rise ignores it; field does this without the prop.",
    },
  ],
  usage: `import { ParticlesBackground } from "@/components/ui/particles-background"

<ParticlesBackground variant="field" paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Every team on one map</h2>
  </section>
</ParticlesBackground>

<ParticlesBackground variant="constellation" effect="pointer" seed={3} className="h-52" />`,
  exports: ["ParticlesBackground"],
}
