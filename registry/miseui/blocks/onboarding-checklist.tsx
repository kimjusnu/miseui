import type * as React from "react"
import { Landmark, Send, Store, UserPlus } from "lucide-react"
import { OnboardingBanner } from "./onboarding-checklist-banner"
import { OnboardingDialog } from "./onboarding-checklist-dialog"
import { OnboardingPanel } from "./onboarding-checklist-panel"
import type { OnboardingStep } from "./onboarding-checklist-state"

type OnboardingChecklistVariant = "panel" | "banner" | "dialog"

const DEFAULT_STEPS: readonly OnboardingStep[] = [
  { id: "workspace", title: "Name your workspace", description: "It appears on every invoice you send.", actionLabel: "Name it", icon: Store },
  { id: "bank", title: "Connect your bank", description: "Payments land here, and you can change it later.", actionLabel: "Connect", icon: Landmark },
  { id: "invoice", title: "Send a test invoice", description: "It goes only to you, so nothing real moves.", actionLabel: "Send a test", icon: Send },
  { id: "invite", title: "Invite your accountant", description: "They can read the books and cannot move money.", actionLabel: "Invite", icon: UserPlus },
]

const NOTHING_DONE: readonly string[] = []

interface OnboardingChecklistProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** `panel` the list as its own screen, `banner` a slim row above your page, `dialog` one step at a time on a first visit. Anything else is `panel`. */
  variant?: OnboardingChecklistVariant
  title?: string
  /** Continues the title, one tone quieter. On `banner` it is shown once every step is done. */
  description?: string
  steps?: readonly OnboardingStep[]
  /** Ids of finished steps. Pass it to decide yourself when a step counts as done; leave it out and pressing a step's button ticks it. */
  completed?: readonly string[]
  /** What is really done already. Progress starts at this count and never above it, so do not seed it to flatter the bar. */
  defaultCompleted?: readonly string[]
  onCompletedChange?: (completed: readonly string[]) => void
  /** Runs when a step's button is pressed. Return a promise to get the loading state; a rejection's message is shown beside the step. */
  onStep?: (id: string) => void | Promise<void>
  /** The button once everything is done. */
  finishLabel?: string
  onFinish?: () => void
  /** Hiding is remembered by you: save it and stop rendering this. `panel` only offers the button when this is passed. */
  onDismiss?: () => void
  /** `dialog` only. */
  open?: boolean
  /** `dialog` only. A welcome greets on arrival, so it starts open. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function OnboardingChecklist({
  variant,
  title = "Finish setting up Paperline.",
  description = "A few minutes, in any order.",
  steps = DEFAULT_STEPS,
  completed,
  defaultCompleted = NOTHING_DONE,
  finishLabel = "Open Paperline",
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: OnboardingChecklistProps) {
  const shared = { title, description, steps, completed, defaultCompleted, finishLabel, ...props }
  if (variant === "banner") return <OnboardingBanner {...shared} />
  if (variant === "dialog") return <OnboardingDialog {...shared} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} />
  return <OnboardingPanel {...shared} />
}

export { OnboardingChecklist, type OnboardingChecklistProps, type OnboardingChecklistVariant, type OnboardingStep }
