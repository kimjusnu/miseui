import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "landing-hero",
  title: "Landing Hero",
  category: "blocks",
  description:
    "A marketing hero with one message and two actions, in four layouts: beside a live preview, over a wide product plate, beside two overlapped fragments, or type alone. The call and the people in it are sample content.",
  why: {
    principle: "Serial position effect",
    explanation:
      "Visitors weigh what they read first and decide in seconds whether to stay, so the one claim that matters is the first and largest thing on the page. Nothing competes above it: no pill, no logo row, no third button. The preview on the right then proves the claim by doing the work in front of them, which a static screenshot cannot.",
    avoid:
      "Do not stretch the headline past two lines or add a tagline under the buttons, since every extra line weakens the first one. Do not put a preview here that your product cannot really do, because the first thing people try is what they just watched. A hero with no product to show should pass preview={null} and let the headline carry the page.",
  },
  designs: [
    {
      name: "split",
      principle: "Serial position effect",
      use: "Your product can show itself working in a small space: the claim is read first and the preview proves it right beside it.",
    },
    {
      name: "centered",
      principle: "Picture superiority effect",
      use: "Your screen is the selling point and needs width: one centred claim, then the product at full size on a rounded plate.",
    },
    {
      name: "overlap",
      principle: "Figure and ground",
      use: "Your product turns one thing into another: the raw input sits behind and the finished output lies in front of it.",
    },
    {
      name: "minimal",
      principle: "Hick's law",
      use: "You have nothing to show yet: no invented screenshot, one sentence in large type and one thing to do.",
    },
  ],
  usage: `import { LandingHero } from "@/components/landing-hero"

<LandingHero
  variant="split"
  headline="Calls that end in a plan."
  headlineQuiet="Written before you leave."
  description="It listens to the call, writes down who owns what, and sends it to everyone who was there."
  primaryAction={{ label: "Try it on your next call", href: "/signup" }}
  secondaryAction={{ label: "See a sample summary", href: "/sample" }}
  preview={<YourProduct />}
/>

// Two pieces of your product, the one behind first
<LandingHero variant="overlap" fragments={[<YourInput />, <YourResult />]} />

// Nothing to show yet: one button
<LandingHero variant="minimal" primaryAction={{ label: "Get early access", href: "/waitlist" }} />`,
  exports: ["LandingHero", "LandingHeroPreview"],
}
