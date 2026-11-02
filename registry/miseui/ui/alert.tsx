import type * as React from "react"
import { useState } from "react"
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  AlertAction,
  DismissButton,
  DISMISS_ROOM_CLASS,
  ROOT_CLASS,
  ToneChip,
  ToneGlyph,
  ToneRail,
  TONE_CLASS,
  type AlertActionProps,
  type AlertTone,
  type AlertVariant,
} from "@/registry/miseui/ui/alert-parts"
import { cn } from "@/registry/miseui/lib/utils"

type AlertEffect = "materialize"

const INSTANT = { duration: 0 } as const
const ENTER_SCALE = 0.96
const ENTER_BLUR = "blur(8px)"

type AlertProps = Omit<React.ComponentProps<"div">, "title" | "children"> & {
  /** `soft` a tinted block, `outline` a card with the action beside it, `banner` a solid page-wide strip, `side` a rail. */
  variant?: AlertVariant
  /** `success` uses the theme accent. `warning` and `neutral` are told apart by their glyphs, as the theme has no warning colour. */
  tone?: AlertTone
  /** `materialize` arrives out of focus and springs its height on dismiss, so the page below closes up instead of jumping. */
  effect?: AlertEffect
  title?: React.ReactNode
  description?: React.ReactNode
  /** Usually an AlertAction or a small Button. */
  action?: React.ReactNode
  /** Replaces the tone's icon. */
  icon?: React.ReactNode
  /** Shows a close button. */
  dismissible?: boolean
  /** Name of the close button for assistive tech. */
  dismissLabel?: string
  /** Hands visibility to you. */
  open?: boolean
  defaultOpen?: boolean
  onDismiss?: () => void
}

type AlertSurfaceProps = Omit<AlertProps, "open" | "defaultOpen" | "dismissible" | "onDismiss"> & {
  close?: () => void
}

type AlertCopyProps = Pick<AlertProps, "title" | "description" | "action" | "icon"> & {
  variant: AlertVariant
  tone: AlertTone
}

function AlertLead({ variant, tone, icon }: Pick<AlertCopyProps, "variant" | "tone" | "icon">) {
  if (variant === "side") return <ToneRail tone={tone} />
  if (icon) return icon
  if (variant === "banner") return <ToneGlyph tone={tone} />
  return <ToneChip tone={tone} size={variant === "soft" ? "sm" : "lg"} />
}

function AlertCopy({ variant, tone, title, description, action, icon }: AlertCopyProps) {
  if (variant === "banner") {
    return (
      <p data-part="line" className="min-w-0 flex-1 basis-40 text-sm">
        {title ? <span className="font-medium">{title} </span> : null}
        {description ? <span className="opacity-85">{description}</span> : null}
      </p>
    )
  }
  return (
    <div data-part="text" className={cn("grid min-w-0 flex-1 gap-1", variant === "outline" && "basis-32")}>
      {title ? (
        <p className="flex items-start gap-2 text-sm font-medium [&>svg]:mt-0.5">
          {variant === "side" ? (icon ?? <ToneGlyph tone={tone} />) : null}
          {title}
        </p>
      ) : null}
      {description ? <div className="text-[13px] leading-5 text-muted-foreground">{description}</div> : null}
      {action && variant !== "outline" ? <div data-part="action">{action}</div> : null}
    </div>
  )
}

function AlertSurface({
  variant = "soft",
  tone = "neutral",
  effect,
  title,
  description,
  action,
  icon,
  close,
  dismissLabel = "Dismiss",
  className,
  ...props
}: AlertSurfaceProps) {
  // AnimatePresence keeps the old element alive during the exit, so its button would still fire a second onDismiss.
  const isPresent = useIsPresent()
  const actionInside = variant === "soft" || variant === "side"
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-tone={tone}
      data-effect={effect}
      // Only errors interrupt a screen reader; everything else waits its turn.
      role={tone === "error" ? "alert" : "status"}
      inert={!isPresent}
      className={cn(ROOT_CLASS[variant], TONE_CLASS[variant][tone], close && DISMISS_ROOM_CLASS[variant], className)}
      {...props}
    >
      <AlertLead variant={variant} tone={tone} icon={icon} />
      <AlertCopy {...{ variant, tone, title, description, action, icon }} />
      {action && !actionInside ? (
        <div data-part="action" className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
        </div>
      ) : null}
      {close ? (
        <DismissButton
          label={dismissLabel}
          variant={variant}
          onClick={() => {
            if (isPresent) close()
          }}
        />
      ) : null}
    </div>
  )
}

function AlertPresence({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: ENTER_SCALE, filter: ENTER_BLUR }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }
  const transition = reduceMotion ? INSTANT : SPRING_DEFAULT
  return (
    <motion.div
      data-slot="alert-presence"
      className="overflow-hidden"
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      exit={{ height: 0 }}
      transition={transition}
    >
      <motion.div initial={hidden} animate={shown} exit={hidden} transition={transition}>
        {children}
      </motion.div>
    </motion.div>
  )
}

function Alert({ open, defaultOpen = true, dismissible = false, onDismiss, ...props }: AlertProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const visible = open ?? uncontrolled
  const close = () => {
    setUncontrolled(false)
    onDismiss?.()
  }
  const surface = <AlertSurface {...props} close={dismissible ? close : undefined} />
  if (props.effect !== "materialize") return visible ? surface : null
  return <AnimatePresence>{visible ? <AlertPresence key="alert">{surface}</AlertPresence> : null}</AnimatePresence>
}

export { Alert, AlertAction, type AlertProps, type AlertActionProps, type AlertVariant, type AlertTone, type AlertEffect }
