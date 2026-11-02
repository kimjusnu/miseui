import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type EmptyVariant = "plain" | "dashed" | "card" | "compact"
type EmptyEffect = "materialize"
type EmptyHeadingLevel = 2 | 3 | 4 | 5 | 6

const INSTANT = { duration: 0 } as const
const ENTER_SCALE = 0.96
const ENTER_BLUR = "blur(8px)"

const ROOT_CLASS: Record<EmptyVariant, string> = {
  plain: "flex flex-col items-center gap-3 px-4 py-12 text-center",
  dashed: "flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-12 text-center",
  card: "grid gap-4 rounded-lg border bg-card p-6 text-left text-card-foreground",
  compact: "flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-left",
}

const ICON_CLASS: Record<EmptyVariant, string> = {
  plain: "text-muted-foreground [&>svg]:size-6",
  dashed: "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5",
  card: "flex size-10 items-center justify-center rounded-md bg-muted text-foreground [&>svg]:size-5",
  compact: "shrink-0 text-muted-foreground [&>svg]:size-4",
}

const TEXT_CLASS: Record<EmptyVariant, string> = {
  plain: "grid max-w-sm gap-1",
  dashed: "grid max-w-sm gap-1",
  card: "grid gap-1",
  // The basis makes the actions wrap under the text once a row gets narrow, instead of squeezing the words.
  compact: "grid min-w-0 flex-1 basis-40 gap-1",
}

const ACTIONS_CLASS: Record<EmptyVariant, string> = {
  plain: "mt-1 flex flex-wrap justify-center gap-2",
  dashed: "mt-1 flex flex-wrap justify-center gap-2",
  card: "flex flex-wrap gap-2",
  compact: "flex shrink-0 flex-wrap gap-2",
}

type EmptyProps = Omit<React.ComponentProps<"div">, "title" | "children"> & {
  /** `plain` centred with nothing around it, `dashed` a slot waiting to be filled, `card` left-aligned on a surface, `compact` a single row. */
  variant?: EmptyVariant
  /** `materialize` arrives out of focus, so results that vanish feel replaced instead of broken. */
  effect?: EmptyEffect
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Usually one or two Buttons. Lead with the step that gets people out of the empty state. */
  actions?: React.ReactNode
  /** The heading level of the title, to fit the page outline. */
  headingLevel?: EmptyHeadingLevel
  /** Reads the title out when this appears, such as after a search. Leave off for an empty state present on page load. */
  announce?: boolean
}

type EmptyBodyProps = Pick<EmptyProps, "icon" | "title" | "description" | "actions"> & {
  variant: EmptyVariant
  headingLevel: EmptyHeadingLevel
}

function EmptyBody({ variant, headingLevel, icon, title, description, actions }: EmptyBodyProps) {
  const Heading = `h${headingLevel}` as const
  const compact = variant === "compact"
  return (
    <>
      {icon ? (
        <span aria-hidden="true" data-slot="empty-icon" className={ICON_CLASS[variant]}>
          {icon}
        </span>
      ) : null}
      <div data-slot="empty-text" className={TEXT_CLASS[variant]}>
        <Heading className={cn("font-medium", compact ? "text-sm leading-5" : "text-[15px] leading-6")}>{title}</Heading>
        {description ? (
          <p className={cn("text-muted-foreground", compact ? "text-[13px] leading-5" : "text-sm leading-5")}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div data-slot="empty-actions" className={ACTIONS_CLASS[variant]}>
          {actions}
        </div>
      ) : null}
    </>
  )
}

/** motion.div owns the drag and animation handlers, so the rest props have to be narrowed for it. */
type MotionRootProps = React.ComponentProps<typeof motion.div>

function EmptyPresence(props: MotionRootProps) {
  const reduceMotion = useReducedMotion() ?? false
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: ENTER_SCALE, filter: ENTER_BLUR }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }
  return <motion.div initial={hidden} animate={shown} transition={reduceMotion ? INSTANT : SPRING_DEFAULT} {...props} />
}

function Empty({ variant = "plain", effect, icon, title, description, actions, headingLevel = 3, announce = false, className, ...props }: EmptyProps) {
  const body = <EmptyBody {...{ variant, headingLevel, icon, title, description, actions }} />
  const root = {
    "data-slot": "empty",
    "data-variant": variant,
    "data-effect": effect,
    role: announce ? "status" : undefined,
    className: cn("w-full min-w-0", ROOT_CLASS[variant], className),
  }
  if (effect === "materialize") {
    return (
      <EmptyPresence {...root} {...(props as MotionRootProps)}>
        {body}
      </EmptyPresence>
    )
  }
  return (
    <div {...root} {...props}>
      {body}
    </div>
  )
}

export { Empty, type EmptyProps, type EmptyVariant, type EmptyEffect, type EmptyHeadingLevel }
