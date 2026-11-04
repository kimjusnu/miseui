import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button, type ButtonProps } from "@/registry/miseui/ui/button"

interface CtaAction {
  label: string
  /** Renders a real link, so it can be opened in a new tab and read by crawlers. */
  href?: string
  onClick?: () => void
}

interface CtaSectionCopyProps extends React.ComponentProps<"section"> {
  /** With headlineQuiet, two lines at most. This is a last nudge and not a second hero. */
  headline?: string
  /** Continues the headline in the same size, one tone quieter. */
  headlineQuiet?: string
  /** One sentence. Not shown on `banner`, which has room for the headline alone. */
  description?: string
  primaryAction?: CtaAction
  /** Null leaves one button. Not shown on `banner`. */
  secondaryAction?: CtaAction | null
  /** What it does not cost, right under the buttons. Say only what is true of your product. Null removes it. */
  note?: string | null
}

const DEFAULT_COPY = {
  headline: "Your next call can end in a plan.",
  headlineQuiet: "Invite it once and see.",
  description: "It listens, writes down who owns what, and sends it to everyone who was there.",
  primaryAction: { label: "Try it on your next call" },
  secondaryAction: { label: "See a sample summary" },
  note: "No card needed. Cancel from settings.",
} as const

const ROOT_CLASS = "@container flex w-full flex-col justify-center bg-muted dark:bg-background"

function CtaButton({ action, variant, className, children }: { action: CtaAction; variant: ButtonProps["variant"]; className?: string; children?: React.ReactNode }) {
  if (action.href) {
    return (
      <Button asChild size="lg" variant={variant} className={className}>
        <a href={action.href} onClick={action.onClick}>
          {action.label}
          {children}
        </a>
      </Button>
    )
  }
  return (
    <Button size="lg" variant={variant} onClick={action.onClick} className={className}>
      {action.label}
      {children}
    </Button>
  )
}

function CtaActions({ primary, secondary, className }: { primary: CtaAction; secondary: CtaAction | null; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <CtaButton action={primary} variant="mise">
        <ArrowRight />
      </CtaButton>
      {secondary ? <CtaButton action={secondary} variant="ghost" /> : null}
    </div>
  )
}

function CtaHeading({ headline, quiet, className }: { headline: string; quiet: string; className?: string }) {
  return (
    <h2 className={cn("text-title text-3xl text-balance", className)}>
      {headline} <span className="text-muted-foreground">{quiet}</span>
    </h2>
  )
}

function CtaNote({ note, className }: { note: string | null; className?: string }) {
  if (!note) return null
  return <p className={cn("text-[13px] leading-5 text-pretty text-muted-foreground", className)}>{note}</p>
}

export { CtaActions, CtaButton, CtaHeading, CtaNote, DEFAULT_COPY, ROOT_CLASS, type CtaAction, type CtaSectionCopyProps }
