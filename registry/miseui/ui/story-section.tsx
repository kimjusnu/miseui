import type * as React from "react"
import { useId, useRef } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type StorySectionVariant = "stacked" | "aside" | "chapter"
type StorySectionEffect = "reveal"
type StoryHeading = "h2" | "h3" | "h4"

/** Slower than a press: a block of text arriving should be felt, not noticed. */
const REVEAL_TRANSITION = { ...SPRING_DEFAULT, duration: 0.6 }
const VIEW_MARGIN = "0px 0px -10% 0px"

const ROOT_CLASS: Record<StorySectionVariant, string> = {
  stacked: "border-t pt-8 pb-12",
  aside: "border-t pt-8 pb-12",
  chapter: "pt-12 pb-12",
}

/** On a child of the root: an element cannot answer a container query about itself. Only a wide column has room for the heading to ride along. */
const LAYOUT_CLASS: Record<StorySectionVariant, string> = {
  stacked: "",
  aside: "grid grid-cols-[minmax(0,1fr)] gap-4 @xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] @xl:gap-8",
  chapter: "",
}

const HEADER_CLASS: Record<StorySectionVariant, string> = {
  stacked: "grid gap-1",
  aside: "grid content-start gap-1 @xl:sticky @xl:top-24 @xl:self-start",
  chapter: "grid gap-2",
}

const NUMBER_CLASS: Record<StorySectionVariant, string> = {
  stacked: "font-mono text-xs leading-5 text-muted-foreground tabular-nums",
  aside: "font-mono text-xs leading-5 text-muted-foreground tabular-nums",
  chapter: "text-[clamp(48px,24cqi,96px)] leading-none font-semibold tracking-tight text-muted-foreground/60 tabular-nums",
}

const TITLE_CLASS: Record<StorySectionVariant, string> = {
  stacked: "text-title text-[clamp(20px,6cqi,28px)] text-pretty",
  aside: "text-title text-[clamp(20px,5cqi,24px)] text-pretty",
  chapter: "text-title text-[clamp(28px,9cqi,48px)] text-pretty",
}

const BODY_CLASS: Record<StorySectionVariant, string> = {
  stacked: "mt-4 min-w-0 text-[15px] leading-7",
  aside: "min-w-0 text-[15px] leading-7",
  chapter: "mt-6 max-w-[65ch] min-w-0 text-[15px] leading-7",
}

function StoryBody({ reveal, className, children }: { reveal: boolean; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: VIEW_MARGIN })
  if (!reveal) {
    return (
      <div data-slot="story-section-body" className={className}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      ref={ref}
      data-slot="story-section-body"
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={seen ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={REVEAL_TRANSITION}
    >
      {children}
    </motion.div>
  )
}

type StorySectionProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** The section's number, zero padded when it is a number. */
  no?: number | string
  title: React.ReactNode
  /** The heading level, so the outline of the page stays right. */
  as?: StoryHeading
  /** A note shown in a dashed box while there is no content, such as the question this section should answer. With neither, the section is left out. */
  pending?: React.ReactNode
  /** `stacked` number and title above the text, `aside` the heading stays beside the text on wide screens, `chapter` a large numeral opens the section. */
  variant?: StorySectionVariant
  /** `reveal` lets the text arrive once it comes into view. */
  effect?: StorySectionEffect
}

function formatNumber(no: number | string) {
  return typeof no === "number" ? String(no).padStart(2, "0") : no
}

function StorySection({ no, title, as: Heading = "h2", pending, variant = "stacked", effect, className, children, ...props }: StorySectionProps) {
  const reduceMotion = useReducedMotion() ?? false
  const titleId = useId()
  const hasContent = children !== undefined && children !== null && children !== false
  if (!hasContent && !pending) return null
  return (
    <section aria-labelledby={titleId} data-slot="story-section" data-variant={variant} data-effect={effect} className={cn("@container w-full min-w-0 scroll-mt-24", ROOT_CLASS[variant], className)} {...props}>
      <div data-slot="story-section-layout" className={LAYOUT_CLASS[variant]}>
        <header data-slot="story-section-header" className={HEADER_CLASS[variant]}>
          {no === undefined ? null : <p data-slot="story-section-number" className={NUMBER_CLASS[variant]}>{formatNumber(no)}</p>}
          <Heading id={titleId} className={TITLE_CLASS[variant]}>
            {title}
          </Heading>
        </header>
        <StoryBody reveal={effect === "reveal" && !reduceMotion} className={BODY_CLASS[variant]}>
          {hasContent ? children : <p data-slot="story-section-pending" className="rounded-lg border border-dashed p-4 text-[13px] leading-5 text-muted-foreground">{pending}</p>}
        </StoryBody>
      </div>
    </section>
  )
}

export { StorySection, type StorySectionProps, type StorySectionVariant, type StorySectionEffect }
