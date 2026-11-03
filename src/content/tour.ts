import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tour",
  title: "Tour",
  category: "overlays",
  description: "A step-by-step product tour with a spotlight cut-out, anchored to a selector or a ref. It manages focus, scrolls targets into view, follows them on resize and skips the ones that are missing.",
  why: {
    principle: "Von Restorff effect",
    explanation:
      "The one thing lit on a dim page gets looked at, so a new feature can be pointed out at the exact spot where it lives instead of being described somewhere else. One idea per step keeps the load low, and the count tells people how much of their attention it will cost.",
    avoid:
      "Do not tour what a better label would explain, and do not start one uninvited on every visit. Keep it to three or four steps, always let people leave, and never make a tour the only documentation.",
  },
  designs: [
    {
      name: "spotlight",
      principle: "Von Restorff effect",
      use: "For the first run of a product or a major new feature, when it is fine to pause the page for a moment.",
    },
    {
      name: "popover",
      principle: "Proximity",
      use: "For one small new thing inside a screen people are in the middle of using: it points without stopping them.",
    },
    {
      name: "banner",
      principle: "Peripheral attention",
      use: "When the card would cover what it is explaining, such as a full-width table or a phone screen. The ring marks the spot.",
    },
    {
      name: "checklist",
      principle: "Goal gradient effect",
      use: "For setup that takes a while. Every step stays in view, people choose the order, and seeing the list get done pulls them on.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Continuity",
      use: "When steps move around the same screen: the highlight and the card travel together, so the eye goes with them. Scrolling by hand stays attached with no lag.",
    },
  ],
  usage: `import { Tour, type TourStep } from "@/components/ui/tour"

const steps: TourStep[] = [
  { target: "#projects", title: "Your projects", body: "Everything lives here." },
  { target: inviteRef, title: "Invite people", body: "Work together.", placement: "right" },
  { title: "All set", body: "A step without a target sits in the middle of the page." },
]

<Tour steps={steps} open={open} onOpenChange={setOpen} effect="spring" onFinish={markSeen} />

<Tour steps={steps} variant="checklist" title="Set up your workspace" defaultOpen />`,
  exports: ["Tour"],
}
