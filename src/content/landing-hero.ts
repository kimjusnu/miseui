import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "landing-hero",
  title: "Landing Hero",
  category: "blocks",
  description:
    "A left-aligned marketing hero with one message, two actions and a live product preview built from real components, not a screenshot. The call and the people in it are sample content.",
  why: {
    principle: "Serial position effect",
    explanation:
      "Visitors weigh what they read first and decide in seconds whether to stay, so the one claim that matters is the first and largest thing on the page. Nothing competes above it: no pill, no logo row, no third button. The preview on the right then proves the claim by doing the work in front of them, which a static screenshot cannot.",
    avoid:
      "Do not stretch the headline past two lines or add a tagline under the buttons, since every extra line weakens the first one. Do not put a preview here that your product cannot really do, because the first thing people try is what they just watched. A hero with no product to show should pass preview={null} and let the headline carry the page.",
  },
  usage: `import { LandingHero } from "@/components/landing-hero"

<LandingHero
  headline="Calls that end in a plan."
  headlineQuiet="Written before you leave."
  description="It listens to the call, writes down who owns what, and sends it to everyone who was there."
  primaryAction={{ label: "Try it on your next call", href: "/signup" }}
  secondaryAction={{ label: "See a sample summary", href: "/sample" }}
  preview={<YourProduct />}
/>`,
  exports: ["LandingHero", "LandingHeroPreview"],
}
