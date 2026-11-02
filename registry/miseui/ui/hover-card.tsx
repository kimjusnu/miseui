import type * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import {
  LinkPreviewBody,
  ProfileBody,
  StatBody,
  sparklinePoints,
  type HoverCardFact,
  type HoverCardLinkPreviewBody,
  type HoverCardProfileBody,
  type HoverCardStatBody,
} from "@/registry/miseui/ui/hover-card-bodies"
import { cn } from "@/registry/miseui/lib/utils"

/** Long enough that a cursor crossing the link on its way elsewhere does not pop a card. */
const OPEN_DELAY_MS = 300
/** Long enough to travel from the trigger into the card. */
const CLOSE_DELAY_MS = 150
const SIDE_OFFSET_PX = 8
const COLLISION_PADDING_PX = 8

type HoverCardVariant = "plain" | "profile" | "link-preview" | "stat"
type HoverCardEffect = "materialize"

const PANEL_CLASS: Record<HoverCardVariant, string> = {
  plain: "w-64 p-4 text-[13px] leading-5",
  profile: "w-80 p-4",
  "link-preview": "w-80 overflow-hidden p-0",
  stat: "w-56 p-4",
}

const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
]

/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-90 blur-in-sm fade-out-0 zoom-out-90 blur-out-sm",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

function HoverCard({
  openDelay = OPEN_DELAY_MS,
  closeDelay = CLOSE_DELAY_MS,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" openDelay={openDelay} closeDelay={closeDelay} {...props} />
}

function HoverCardTrigger(props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

type HoverCardPanelProps = Omit<React.ComponentProps<typeof HoverCardPrimitive.Content>, "title"> & {
  /** `materialize` grows the card out of its trigger with scale, blur and opacity together. */
  effect?: HoverCardEffect
}

type HoverCardPlainBody = { variant?: "plain"; children?: React.ReactNode }

type HoverCardContentProps = HoverCardPanelProps &
  (HoverCardPlainBody | HoverCardProfileBody | HoverCardLinkPreviewBody | HoverCardStatBody)

/** Body fields are not DOM attributes; everything else on the props goes to the Radix panel. */
const BODY_KEYS: ReadonlySet<string> = new Set([
  "variant", "name", "handle", "avatar", "bio", "facts", "title", "description", "domain", "media", "label", "value",
  "change", "trend", "children", "effect", "className", "sideOffset", "collisionPadding",
])

function panelAttributes(props: HoverCardContentProps) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !BODY_KEYS.has(key)))
}

function HoverCardBody(props: HoverCardContentProps) {
  switch (props.variant) {
    case "profile":
      return <ProfileBody {...props} />
    case "link-preview":
      return <LinkPreviewBody {...props} />
    case "stat":
      return <StatBody {...props} />
    default:
      return props.children
  }
}

function HoverCardContent(props: HoverCardContentProps) {
  const {
    variant = "plain",
    effect,
    className,
    sideOffset = SIDE_OFFSET_PX,
    collisionPadding = COLLISION_PADDING_PX,
  } = props
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        data-variant={variant}
        data-effect={effect}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 max-w-[calc(100vw-16px)] rounded-lg border bg-popover text-popover-foreground shadow-md outline-hidden",
          "origin-(--radix-hover-card-content-transform-origin)",
          PANEL_CLASS[variant],
          effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS,
          className,
        )}
        {...panelAttributes(props)}
      >
        <HoverCardBody {...props} />
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  sparklinePoints,
  type HoverCardContentProps,
  type HoverCardVariant,
  type HoverCardEffect,
  type HoverCardFact,
}
