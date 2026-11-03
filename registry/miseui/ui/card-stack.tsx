import type * as React from "react"
import { Cascade } from "@/registry/miseui/ui/card-stack-cascade"
import { DEFAULT_LABELS, type CardStackItem, type CardStackLabels } from "@/registry/miseui/ui/card-stack-card"
import { Fan } from "@/registry/miseui/ui/card-stack-fan"
import type { SwipeChoice } from "@/registry/miseui/ui/card-stack-math"
import { Pile } from "@/registry/miseui/ui/card-stack-pile"
import { Swipe } from "@/registry/miseui/ui/card-stack-swipe"

type CardStackVariant = "pile" | "fan" | "swipe" | "cascade"
type CardStackEffect = "autoplay"

const AUTOPLAY_MS = 3600

type CardStackProps = Omit<React.ComponentProps<"div">, "ref" | "children"> & {
  items: readonly CardStackItem[]
  /** Names the stack for assistive tech. */
  label: string
  /** `pile` a scattered heap, drag the top away or press Next, `fan` spreads on hover, focus or tap, `swipe` decide on each card, `cascade` rows peeking from behind that open into a list. */
  variant?: CardStackVariant
  /** `autoplay` sends the top card to the back on a timer, and stops on hover and focus. It does nothing for `swipe`: a decision is not something to make for someone. */
  effect?: CardStackEffect
  /** Milliseconds between turns under `autoplay`. */
  interval?: number
  /** Holds autoplay. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Another seed scatters the `pile` differently, the same on the server and the client. */
  seed?: number
  /** `swipe`: called with the card's id and the side it went to. */
  onDecide?: (id: string, choice: SwipeChoice) => void
  /** The words on the controls. */
  labels?: Partial<CardStackLabels>
}

function CardStack({ items, label, variant = "pile", effect, interval = AUTOPLAY_MS, paused = false, seed = 1, onDecide, labels, ...props }: CardStackProps) {
  const shared = {
    items,
    label,
    autoplay: effect === "autoplay",
    paused,
    interval,
    seed,
    labels: { ...DEFAULT_LABELS, ...labels },
    rootProps: { ...props, "data-slot": "card-stack", "data-variant": variant, "data-effect": effect } as React.ComponentProps<"div">,
  }
  if (variant === "fan") return <Fan {...shared} />
  if (variant === "swipe") return <Swipe {...shared} autoplay={false} onDecide={onDecide} />
  if (variant === "cascade") return <Cascade {...shared} />
  return <Pile {...shared} />
}

export { CardStack, type CardStackProps, type CardStackVariant, type CardStackEffect, type CardStackItem, type CardStackLabels, type SwipeChoice }
