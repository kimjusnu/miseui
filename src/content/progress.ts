import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "progress",
  title: "Progress",
  category: "feedback",
  description:
    "Shows how far a task has come, as a bar, a hairline, discrete steps or a labelled percent, and admits it when nobody knows yet.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "People wait longer and more calmly when they can see the end coming. A determinate bar answers how much is left, and leaving the value empty switches to a sweep that claims no number, because a fake percentage is worse than none. The value is exposed through role and aria values, so assistive tech hears the same answer.",
    avoid:
      "Skip it under about a second, where a bar only flashes, and for a wait with no moving parts, where a skeleton shows what is coming. Never loop a determinate bar back to zero to look busy.",
  },
  designs: [
    {
      name: "plain",
      principle: "Goal gradient",
      use: "Use it inside a card or a dialog, where the surrounding text already says what is happening.",
    },
    {
      name: "thin",
      principle: "Peripheral attention",
      use: "Use it along the top edge of a page or a panel, for background work that should be noticed without being watched.",
    },
    {
      name: "segmented",
      principle: "Chunking",
      use: "Use it for a known count of real steps, such as an onboarding flow, where a cell that fills means a stage is done.",
    },
    {
      name: "labelled",
      principle: "Redundant coding",
      use: "Use it for a long task someone is actually waiting on, where the name and the number save a second look.",
    },
  ],
  effects: [
    {
      name: "shimmer",
      principle: "Perceived duration",
      use: "Use it on a long stretch where the value can stall, so a bar that has not moved still reads as alive; it stops at 100.",
    },
    {
      name: "spring",
      principle: "Continuity",
      use: "Use it when values arrive in uneven jumps, because the fill settles into each one instead of snapping.",
    },
  ],
  usage: `import { Progress } from "@/components/ui/progress"

<Progress label="Uploading photos" value={45} />
<Progress label="Uploading photos" value={45} variant="labelled" effect="shimmer" />
<Progress label="Setup" value={2} max={5} steps={5} variant="segmented" />

// No value means indeterminate
<Progress label="Connecting" />`,
  exports: ["Progress"],
}
