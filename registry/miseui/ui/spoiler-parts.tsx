import type * as React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Eye } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { previewOfText, useFocusOnReveal, useOverflowing } from "@/registry/miseui/ui/spoiler-state"
import { cn } from "@/registry/miseui/lib/utils"

const INSTANT = { duration: 0 } as const
const BLUR_PX = 8
const COLLAPSED_FADE = "linear-gradient(to bottom, black calc(100% - 48px), transparent)"

const COVER_FOCUS_CLASS = "outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"

interface PanelProps {
  revealed: boolean
  onReveal: () => void
  label: string
  animated: boolean
  children: React.ReactNode
}

/** Hidden content is real DOM that sets the size, but aria-hidden and inert keep it from being read or tabbed into. */
function hiddenProps(revealed: boolean) {
  return { "aria-hidden": revealed ? undefined : true, inert: !revealed } as const
}

function BlurSpoiler({ revealed, onReveal, label, animated, children }: PanelProps) {
  const { target, markPressed } = useFocusOnReveal(revealed)
  const blur = `blur(${revealed ? 0 : BLUR_PX}px)`
  return (
    <div className="relative rounded-md">
      <motion.div
        ref={target as React.RefObject<HTMLDivElement>}
        tabIndex={revealed ? -1 : undefined}
        data-slot="spoiler-content"
        {...hiddenProps(revealed)}
        className={cn("rounded-md outline-none", !revealed && "select-none")}
        // The first paint is already blurred, so nothing can flash in the clear before the style lands.
        initial={{ filter: blur }}
        animate={{ filter: blur }}
        transition={animated ? SPRING_DEFAULT : INSTANT}
      >
        {children}
      </motion.div>
      {revealed ? null : (
        <button
          type="button"
          aria-expanded={false}
          data-slot="spoiler-cover"
          className={cn("absolute inset-0 grid cursor-pointer place-items-center rounded-md", COVER_FOCUS_CLASS)}
          onClick={() => {
            markPressed()
            onReveal()
          }}
        >
          <span className="inline-flex h-8 items-center gap-2 rounded-full border bg-background px-3 text-[13px] font-medium shadow-xs pointer-coarse:h-10">
            <Eye aria-hidden="true" className="size-4 text-muted-foreground" />
            {label}
          </span>
        </button>
      )}
    </div>
  )
}

function BlockSpoiler({ revealed, onReveal, label, animated, children }: PanelProps) {
  const { target, markPressed } = useFocusOnReveal(revealed)
  return (
    <div className="relative min-h-10 overflow-hidden rounded-md">
      {/* Keeps its room behind the opaque cover, so opening it moves nothing else on the page. */}
      <div ref={target as React.RefObject<HTMLDivElement>} tabIndex={revealed ? -1 : undefined} data-slot="spoiler-content" {...hiddenProps(revealed)} className={cn("outline-none", !revealed && "invisible select-none")}>
        {children}
      </div>
      <AnimatePresence initial={false}>
        {revealed ? null : (
          <motion.button
            type="button"
            aria-expanded={false}
            data-slot="spoiler-cover"
            className={cn("absolute inset-0 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-muted px-3 text-[13px] font-medium", COVER_FOCUS_CLASS)}
            exit={{ opacity: 0 }}
            transition={animated ? SPRING_DEFAULT : INSTANT}
            onClick={() => {
              markPressed()
              onReveal()
            }}
          >
            <Eye aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            {label}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A span, not a button: browsers treat a button as one box, and a redaction bar has to wrap with the sentence around it.
 * The same element before and after, so the colours can transition and focus simply stays where it is.
 */
function InlineSpoiler({ revealed, onReveal, label, animated, children }: PanelProps) {
  const cover = revealed
    ? { tabIndex: -1 }
    : {
        role: "button",
        tabIndex: 0,
        "aria-label": label,
        onClick: onReveal,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key !== "Enter" && event.key !== " ") return
          event.preventDefault()
          onReveal()
        },
      }
  return (
    <span
      {...cover}
      data-slot={revealed ? "spoiler-content" : "spoiler-cover"}
      className={cn(
        "rounded-sm box-decoration-clone outline-none",
        !revealed && "cursor-pointer bg-foreground text-transparent select-none hover:bg-foreground/80 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        animated && "transition-[color,background-color] duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none",
      )}
    >
      <span aria-hidden={revealed ? undefined : true}>{children}</span>
    </span>
  )
}

interface MoreSpoilerProps extends Omit<PanelProps, "onReveal"> {
  onToggle: () => void
  hideLabel: string
  collapsedHeight: number
  preview?: React.ReactNode
}

function MoreSpoiler({ revealed, onToggle, label, hideLabel, animated, collapsedHeight, preview, children }: MoreSpoilerProps) {
  const [clip, setClip] = useState<HTMLDivElement | null>(null)
  const overflowing = useOverflowing(clip, collapsedHeight)
  const open = revealed || !overflowing
  const spoken = preview ?? (typeof children === "string" ? previewOfText(children) : null)
  return (
    <div className="grid min-w-0 justify-items-start gap-2">
      <motion.div
        ref={setClip}
        data-slot="spoiler-content"
        className="w-full overflow-hidden"
        {...hiddenProps(open)}
        initial={false}
        animate={{ height: open ? "auto" : collapsedHeight }}
        transition={animated ? SPRING_DEFAULT : INSTANT}
        style={open ? undefined : { maskImage: COLLAPSED_FADE, WebkitMaskImage: COLLAPSED_FADE }}
      >
        <div>{children}</div>
      </motion.div>
      {/* The sighted reader sees the first lines through the fade, so the screen reader is given the same start. */}
      {open || !spoken ? null : <p className="sr-only">{spoken}</p>}
      {overflowing ? (
        <button
          type="button"
          aria-expanded={revealed}
          data-slot="spoiler-toggle"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 -mx-2 text-[13px] font-medium text-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"
          onClick={onToggle}
        >
          {revealed ? hideLabel : label}
          <ChevronDown aria-hidden="true" className={cn("size-4 text-muted-foreground", revealed && "rotate-180")} />
        </button>
      ) : null}
    </div>
  )
}

export { BlockSpoiler, BlurSpoiler, InlineSpoiler, MoreSpoiler }
