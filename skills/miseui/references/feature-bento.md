# Feature Bento

A features section in three forms: an asymmetric grid of mixed cell sizes, alternating picture and text rows, or a list of features driving one large panel. The features shown are sample content.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/feature-bento.json
```

## Why it looks like this

**Aesthetic-usability effect.** Three equal cards say every feature matters the same, so visitors read none of them. Cells of different sizes rank the features before a word is read, and the big cell goes to the one that sells the product. A surface that looks considered also buys patience: people give a polished page longer and forgive more of it, which is exactly what a features section needs.

**Don't.** No more than three effects may run at once on this grid: each one competes for the eye, and the liquid metal also keeps the GPU awake. Anything beyond three should move only when pressed, as the merge cell does. Do not give every cell a visual, and do not use it for features of equal weight, where a plain list is more honest.

## Designs

Pass one as the `variant` prop.

- `bento` (Aesthetic-usability effect): You have one feature that sells the product and a few that support it: the size of each cell ranks them before a word is read.
- `rows` (Law of proximity): Each feature needs a real explanation beside a real picture, and people will scroll: one idea per row, with its proof right next to it.
- `tabs` (Progressive disclosure): Your features are parts of one screen and the page must stay short: the list is always in view and one large panel answers.

## Usage

```tsx
import { FeatureBento } from "@/components/feature-bento"

<FeatureBento
  variant="bento"
  title="After you hang up."
  titleQuiet="The notes take care of themselves."
  features={[
    { id: "summary", title: "Keeps working after you hang up.", description: "...", span: 4, visual: <YourVisual /> },
    { id: "ask", title: "Ask the call anything.", description: "...", span: 2, tone: "dark" },
    { id: "no-bot", title: "No bot in the call.", description: "...", span: 2 },
    { id: "send", title: "Goes where the team reads.", description: "...", span: 4 },
  ]}
/>

// The same list as rows or tabs: span and tone only apply to the grid
<FeatureBento variant="rows" features={features} />
<FeatureBento variant="tabs" features={features} defaultFeatureId="ask" />
```

Exports: `FeatureBento`
