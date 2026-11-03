import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "page-wipe",
  title: "Page Wipe",
  category: "transitions",
  description: "A full-page wipe between screens: an accent curtain, a slanted sweep or an iris opening from the click.",
  why: {
    principle: "Peak-end rule",
    explanation:
      "A deliberate change of scene tells people they have arrived somewhere new, and a site is remembered for its moments of change. It also hides the blink of a page swap, so the wait reads as part of the design and not as a stutter.",
    avoid:
      "Do not wipe on every navigation in a tool people use all day: the second time it is charming, the hundredth time it is a delay. Inside one flow, a shared-axis preset from useViewTransition is the quieter choice.",
  },
  designs: [
    {
      name: "curtain",
      principle: "Closure",
      use: "Between the major sections of a brand site or a portfolio: the accent colour covers the page and lifts off the next one, so it is a clear full stop.",
    },
    {
      name: "sweep",
      principle: "Common fate",
      use: "For moving forward through chapters or a story: the slanted edge travels one way, so it reads as a direction.",
    },
    {
      name: "iris",
      principle: "Object constancy",
      use: "When one thing opens into a whole screen, such as a card into its page: the new view grows from the point that was pressed.",
    },
  ],
  effects: [
    {
      name: "recede",
      principle: "Depth cues",
      use: "When the new page should feel like it arrives on top: the old page shrinks slightly and darkens behind the wipe.",
    },
  ],
  usage: `import { PageWipeLink, usePageWipe } from "@/components/ui/page-wipe"

<PageWipeLink href="/work" variant="curtain" onNavigate={(href) => router.push(href)}>
  Work
</PageWipeLink>

const wipe = usePageWipe({ variant: "iris", effect: "recede" })

<button onClick={(event) => wipe(() => setScreen("detail"), event)}>Open</button>`,
  exports: ["PageWipeLink", "usePageWipe"],
}
