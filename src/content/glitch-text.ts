import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "glitch-text",
  title: "Glitch Text",
  category: "text",
  description: "A short stepped burst that ends in clean text, for the one line that should feel like something just happened.",
  why: {
    principle: "Abrupt onset",
    explanation:
      "A sudden change captures attention before people decide to look, which suits the moment a state flips: back online, access granted. The burst is under a second and always ends in plain text, so the attention it earns is spent on reading the line, and stepped timing is the point: smoothing it would read as a slow animation and not as a fault.",
    avoid:
      "Never loop it: a glitch that keeps going makes a page unreadable and can harm people sensitive to flicker. Use it once per view at most, not on body text or on error messages, where a fault look makes a real problem harder to trust.",
  },
  designs: [
    {
      name: "split",
      principle: "Chromatic aberration",
      use: "A display headline: red and cyan fringes pull apart and snap back, the most recognisable look with the text itself never moving.",
    },
    {
      name: "slice",
      principle: "Continuity break",
      use: "A large line where a torn signal fits: horizontal bands shift sideways through clip paths and rejoin.",
    },
    {
      name: "flicker",
      principle: "Mental model",
      use: "A sign or a status coming on: letters drop out and return like a tube starting, the quietest of the four and the one that suits small type.",
    },
    {
      name: "skew",
      principle: "Economy of motion",
      use: "A short label in a tight spot: the whole line jumps in steps, with no extra layers on top of the text.",
    },
  ],
  effects: [
    {
      name: "hover",
      principle: "Feedback",
      use: "A link that answers when pointed at or focused and is otherwise plain. It has a one second cool-down, so running a pointer back and forth cannot make it flash.",
    },
  ],
  usage: `import { GlitchText } from "@/components/ui/glitch-text"

<GlitchText as="h1" text="Connection restored" />

<GlitchText text="Signal recovered" variant="slice" trigger="mount" />

<a href="/status">
  <GlitchText text="See system status" variant="skew" effect="hover" />
</a>`,
  exports: ["GlitchText"],
}
