import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "onboarding-checklist",
  title: "Onboarding Checklist",
  category: "blocks",
  description: "First-run setup with a true progress count: a list as its own screen, a slim row above the page, or welcome steps one at a time in a dialog.",
  why: {
    principle: "Goal gradient",
    explanation:
      "People work harder as the end comes into sight, so a count of what is left keeps them moving where a list of chores does not. Progress here starts above zero only if something is really done, because a bar seeded to look further along stops being believed the first time someone reads the list.",
    avoid:
      "Do not use it for a one-step product, or as a tour of your features. Every row must be something a person does and the product can tell was done. Do not count signing up as a step just to start the bar higher.",
  },
  designs: [
    {
      name: "panel",
      principle: "Goal gradient",
      use: "The product does nothing useful until setup is finished, so setup deserves the whole screen and the count stays in view beside the list.",
    },
    {
      name: "banner",
      principle: "Least interruption",
      use: "People can already work, and setup improves things later. The page stays the main thing, and the next step is one press away.",
    },
    {
      name: "dialog",
      principle: "One thing at a time",
      use: "A first visit where a whole list would read as homework. Each step fills the dialog, any can wait, and closing it loses nothing because the Setup button stays on the page.",
    },
  ],
  usage: `import { OnboardingChecklist } from "@/components/onboarding-checklist"

// Pass what is really done. Progress starts at this count and never above it.
<OnboardingChecklist
  steps={[{ id: "bank", title: "Connect your bank", description: "Payments land here.", actionLabel: "Connect" }]}
  completed={doneIds}
  onStep={(id) => openStep(id)}
  onFinish={openProduct}
/>

// People can already work. Save the dismissal and stop rendering this.
<OnboardingChecklist variant="banner" completed={doneIds} onStep={openStep} onDismiss={saveDismissed}>
  <YourPage />
</OnboardingChecklist>

// First visit only. Read your own flag and pass it as open.
<OnboardingChecklist variant="dialog" open={firstVisit} onOpenChange={setFirstVisit} completed={doneIds} onStep={runStep}>
  <YourPage />
</OnboardingChecklist>`,
  exports: ["OnboardingChecklist"],
}
