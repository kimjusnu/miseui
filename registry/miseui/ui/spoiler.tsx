import type * as React from "react"
import { useReducedMotion } from "motion/react"
import { BlockSpoiler, BlurSpoiler, InlineSpoiler, MoreSpoiler } from "@/registry/miseui/ui/spoiler-parts"
import { useReveal } from "@/registry/miseui/ui/spoiler-state"
import { cn } from "@/registry/miseui/lib/utils"

type SpoilerVariant = "blur" | "block" | "inline" | "more"
type SpoilerEffect = "blur"

const DEFAULT_COLLAPSED_PX = 96

type SpoilerProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Stays out of the accessibility tree and the tab order until revealed. */
  children: React.ReactNode
  /** `blur` softens the content in place, `block` covers it with an opaque panel, `inline` redacts words in a sentence, `more` shows the first lines with a fade. */
  variant?: SpoilerVariant
  /** `blur` clears the content in a spring and eases the height of `more`. Instant under reduced motion. */
  effect?: SpoilerEffect
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
  /** What the control says. Defaults to "Show spoiler", or "Show more" for `more`. */
  label?: string
  /** The way back in `more`. */
  hideLabel?: string
  /** Height of `more` while collapsed, in px. */
  collapsedHeight?: number
  /** What a screen reader hears before `more` opens. A plain string child gets its first sentence automatically. */
  preview?: React.ReactNode
}

function Spoiler({
  children,
  variant = "blur",
  effect,
  revealed,
  defaultRevealed,
  onRevealedChange,
  label,
  hideLabel = "Show less",
  collapsedHeight = DEFAULT_COLLAPSED_PX,
  preview,
  className,
  ...props
}: SpoilerProps) {
  const [isRevealed, setRevealed] = useReveal({ revealed, defaultRevealed, onRevealedChange })
  const reduceMotion = useReducedMotion() ?? false
  const animated = effect === "blur" && !reduceMotion
  const shared = { revealed: isRevealed, animated, label: label ?? (variant === "more" ? "Show more" : "Show spoiler"), onReveal: () => setRevealed(true) }
  const attributes = { "data-slot": "spoiler", "data-variant": variant, "data-effect": effect, "data-revealed": isRevealed ? "true" : "false" }
  if (variant === "inline") {
    return (
      <span {...attributes} className={className}>
        <InlineSpoiler {...shared}>{children}</InlineSpoiler>
      </span>
    )
  }
  return (
    <div {...attributes} className={cn("min-w-0", className)} {...props}>
      {variant === "blur" ? <BlurSpoiler {...shared}>{children}</BlurSpoiler> : null}
      {variant === "block" ? <BlockSpoiler {...shared}>{children}</BlockSpoiler> : null}
      {variant === "more" ? (
        <MoreSpoiler {...shared} hideLabel={hideLabel} collapsedHeight={collapsedHeight} preview={preview} onToggle={() => setRevealed(!isRevealed)}>
          {children}
        </MoreSpoiler>
      ) : null}
    </div>
  )
}

export { Spoiler, type SpoilerProps, type SpoilerVariant, type SpoilerEffect }
