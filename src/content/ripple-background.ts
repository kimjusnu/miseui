import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "ripple-background",
  title: "Ripple Background",
  category: "backgrounds",
  description: "Rings spreading behind a section: still lines, a slow pulse, a turning sonar sweep or several sources, plus a ring from where someone pressed.",
  why: {
    principle: "Gestalt continuity",
    explanation:
      "The eye follows rings back to where they started, so concentric lines quietly point at whatever sits in the middle. Every ring fades to nothing before the box edge, so no arc gets cut by a straight line and the box itself never shows.",
    avoid:
      "Do not use it as a fake radar or live status: a sweep with nothing behind it promises data. Keep `press` for surfaces people really press, since a ring from every tap on a long page is only noise.",
  },
  designs: [
    {
      name: "rings",
      principle: "Focal point",
      use: "A static hero or an empty state, where lines around the centre aim the eye at the one sentence and nothing moves.",
    },
    {
      name: "pulse",
      principle: "Rhythm",
      use: "Something that is waiting or listening, such as a call or a signup that is about to open.",
    },
    {
      name: "sonar",
      principle: "Common fate",
      use: "A monitoring or scanning product, when the sweep says what the product does.",
    },
    {
      name: "pond",
      principle: "Law of proximity",
      use: "A wide banner about many places or many people, with sources that keep the whole box lightly alive.",
    },
  ],
  effects: [
    {
      name: "press",
      principle: "Doherty threshold",
      use: "A surface someone taps: the answer appears under the finger at once. It works on touch and leaves the click to whatever is on top.",
    },
  ],
  usage: `import { RippleBackground } from "@/components/ui/ripple-background"

<RippleBackground variant="pulse" paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Your call starts in a minute</h2>
  </section>
</RippleBackground>

<RippleBackground variant="rings" effect="press" className="h-52" />`,
  exports: ["RippleBackground"],
}
