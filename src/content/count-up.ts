import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "count-up",
  title: "Count Up",
  category: "text",
  description: "A number that counts to its value without moving what sits beside it, formatted by Intl, with rolling digits, tiles or a meter line.",
  why: {
    principle: "Change blindness",
    explanation:
      "A figure that simply appears is easy to miss. A short count points the eye at the number and shows which way it went, and because the final text holds the width, nothing around it shifts. Screen readers get the final value once, never the numbers on the way.",
    avoid:
      "Keep it to the few figures a screen is about. Do not count in a table, a form or anything people compare or read twice, and never for a live value that changes constantly: without retarget it updates plainly, which is what those need.",
  },
  designs: [
    {
      name: "plain",
      principle: "Economy of motion",
      use: "A figure inside a paragraph or a stat row, where the number itself is all that should move.",
    },
    {
      name: "odometer",
      principle: "Physical metaphor",
      use: "A total that accumulates, such as orders or downloads: wheels turning say this number builds up.",
    },
    {
      name: "board",
      principle: "Law of common region",
      use: "A figure that is the page's main event, such as seats left or a launch count, with each digit on its own tile.",
    },
    {
      name: "meter",
      principle: "Dual coding",
      use: "A figure with a limit, such as a quota or progress: pass max and the line shows at a glance how much of it is used.",
    },
  ],
  effects: [
    {
      name: "retarget",
      principle: "Interruptibility",
      use: "A figure that changes after someone acts, such as a cart total: it moves from what is showing, and a second change takes over mid-way with no jump.",
    },
  ],
  usage: `import { CountUp } from "@/components/ui/count-up"

<CountUp value={48250} formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />

<CountUp value={1248} variant="odometer" />

<CountUp value={3482} variant="board" locale="en-US" />

<CountUp value={72} max={100} suffix="%" variant="meter" />

<CountUp value={total} variant="odometer" effect="retarget" />`,
  exports: ["CountUp"],
}
