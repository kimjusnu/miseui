# Onboarding Checklist

First-run setup with a true progress count: a list as its own screen, a slim row above the page, or welcome steps one at a time in a dialog.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/onboarding-checklist.json
```

## Why it looks like this

**Goal gradient.** People work harder as the end comes into sight, so a count of what is left keeps them moving where a list of chores does not. Progress here starts above zero only if something is really done, because a bar seeded to look further along stops being believed the first time someone reads the list.

**Don't.** Do not use it for a one-step product, or as a tour of your features. Every row must be something a person does and the product can tell was done. Do not count signing up as a step just to start the bar higher.

## Designs

Pass one as the `variant` prop.

- `panel` (Goal gradient): The product does nothing useful until setup is finished, so setup deserves the whole screen and the count stays in view beside the list.
- `banner` (Least interruption): People can already work, and setup improves things later. The page stays the main thing, and the next step is one press away.
- `dialog` (One thing at a time): A first visit where a whole list would read as homework. Each step fills the dialog, any can wait, and closing it loses nothing because the Setup button stays on the page.

## Usage

```tsx
import { OnboardingChecklist } from "@/components/onboarding-checklist"

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
</OnboardingChecklist>
```

Exports: `OnboardingChecklist`
