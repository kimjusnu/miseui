import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "meteors-background",
  title: "Meteors Background",
  category: "backgrounds",
  description: "Short streaks crossing a section: thin meteors, faint rain, slow comets or a twinkling sky, placed from a seed and moved with transforms only.",
  why: {
    principle: "Peripheral vision",
    explanation:
      "The edge of the eye picks up movement before anything else, so a rare streak makes a section feel alive while the reader keeps looking at the words. Empty sky between the streaks does the work, which is why every variant has a ceiling on its count.",
    avoid:
      "Do not use it next to live data or an error log: a stream of streaks can read as a stream of failures. Do not use it behind body text, and skip it on a page that already has another moving background.",
  },
  designs: [
    {
      name: "meteors",
      principle: "Peripheral vision",
      use: "A launch or event page, where a thin diagonal now and then adds a little occasion.",
    },
    {
      name: "rain",
      principle: "Texture gradient",
      use: "A wide dark section that should feel busy and calm at once. It is denser and much fainter, so it reads as texture.",
    },
    {
      name: "comets",
      principle: "Von Restorff effect",
      use: "A hero with space around the headline. Few, slow and long, so each one is noticed once.",
    },
    {
      name: "stars",
      principle: "Change blindness",
      use: "A sign-in or a closing section: mostly still points that twinkle slowly, with one streak every so often.",
    },
  ],
  effects: [
    {
      name: "flow",
      principle: "Attention economy",
      use: "The default: moves only while on screen, in a visible tab and not paused.",
    },
    {
      name: "still",
      principle: "Attention economy",
      use: "A place where the sky should be there and nothing should move. Reduced motion gets this frame too.",
    },
  ],
  usage: `import { MeteorsBackground } from "@/components/ui/meteors-background"

<MeteorsBackground variant="comets" count={3} paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Launch night, Thursday at nine</h2>
  </section>
</MeteorsBackground>

<MeteorsBackground variant="stars" seed={7} className="h-52" />`,
  exports: ["MeteorsBackground"],
}
