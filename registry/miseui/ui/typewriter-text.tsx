import type * as React from "react"
import { useMemo, useRef } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { typingTimeline, DEFAULT_STEP_MS } from "@/registry/miseui/ui/typewriter-math"
import { useLoopHold, useTypewriterPlay } from "@/registry/miseui/ui/typewriter-play"
import { cn } from "@/registry/miseui/lib/utils"

type TypewriterTextVariant = "line" | "block" | "underscore" | "field"
type TypewriterTextEffect = "loop"
type TypewriterTextTrigger = "view" | "mount"
type TypewriterTextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

const DEFAULT_SEED = 5
const VIEW_MARGIN = "0px 0px -10% 0px"

/**
 * The caret is out of flow on purpose. An inline-block would add a break opportunity in the middle of a word,
 * and the line would jump as the caret moved across it. With no offsets it stays where the text ends.
 */
const CARET_CLASS: Record<TypewriterTextVariant, string> = {
  line: "w-[2px] h-[1.1em] mt-[calc((1lh-1.1em)/2)] bg-current",
  block: "w-[1ch] h-[1lh] bg-foreground",
  underscore: "w-[1ch] h-[2px] mt-[calc(0.5lh+0.42em)] bg-current",
  field: "w-[2px] h-[1.1em] mt-[calc((1lh-1.1em)/2)] bg-mise",
}

const ROOT_CLASS: Record<TypewriterTextVariant, string> = {
  line: "",
  block: "font-mono",
  underscore: "",
  field: "block",
}

const FIELD_BOX = "flex min-h-10 w-full items-center min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground shadow-xs"

function TypedRun({ text, variant }: { text: string; variant: TypewriterTextVariant }) {
  return (
    <>
      <span data-slot="typewriter-text-typed">{text}</span>
      <span data-slot="typewriter-text-caret" className={cn("pointer-events-none absolute", CARET_CLASS[variant])} style={{ opacity: 0 }} />
      {/* Laid out but unseen, so the wrap of every line is settled before the first letter lands. */}
      <span data-slot="typewriter-text-rest" className="invisible" />
    </>
  )
}

/** The run sits on top of every phrase laid out invisibly, so the longest one holds the space for all of them. */
function LoopStack({ phrases, variant }: { phrases: readonly string[]; variant: TypewriterTextVariant }) {
  return (
    <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
      {phrases.map((phrase, index) => (
        <span key={`${index}:${phrase}`} data-slot="typewriter-text-reserve" className="invisible [grid-area:1/1]">
          {phrase}
        </span>
      ))}
      <span className="[grid-area:1/1]">
        <TypedRun text={phrases[0]} variant={variant} />
      </span>
    </span>
  )
}

interface VisualBodyProps {
  list: readonly string[]
  loop: boolean
  variant: TypewriterTextVariant
  prompt: string
}

function VisualBody({ list, loop, variant, prompt }: VisualBodyProps) {
  const body = loop ? <LoopStack phrases={list} variant={variant} /> : <TypedRun text={list[0]} variant={variant} />
  return (
    <>
      {variant === "block" ? (
        <span data-slot="typewriter-text-prompt" className="shrink-0 text-muted-foreground select-none">
          {prompt}
        </span>
      ) : null}
      {variant === "block" || (variant === "field" && !loop) ? <span className="min-w-0">{body}</span> : body}
    </>
  )
}

type TypewriterSource =
  | { effect?: undefined; text: string; phrases?: never; paused?: never }
  | {
      /** `loop` types, waits, deletes and moves to the next phrase. Holds still off screen, in a hidden tab, and on hover or focus. */
      effect: TypewriterTextEffect
      phrases: readonly string[]
      text?: never
      /** Holds the loop on the letter it reached. */
      paused?: boolean
    }

type TypewriterTextProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> &
  TypewriterSource & {
    /** The element to render. A heading stays a heading. */
    as?: TypewriterTextTag
    /** `line` a thin caret, `block` monospace with a block caret and a prompt, `underscore` a low bar, `field` inside an input-looking box as a live placeholder. */
    variant?: TypewriterTextVariant
    /** `view` starts when first seen, `mount` right away. */
    trigger?: TypewriterTextTrigger
    /** The same seed gives the same rhythm. */
    seed?: number
    /** Average time per letter in ms. Long text is sped up to stay short. */
    stepMs?: number
    /** The mark in front of `block`. */
    prompt?: string
  }

function TypewriterText({
  text,
  phrases,
  effect,
  paused = false,
  as: Tag = "span",
  variant = "line",
  trigger = "view",
  seed = DEFAULT_SEED,
  stepMs = DEFAULT_STEP_MS,
  prompt = "$",
  className,
  ...props
}: TypewriterTextProps) {
  const loop = effect === "loop"
  const list = phrases && phrases.length > 0 ? phrases : [text ?? ""]
  // An inline array is a new value every render, and a new timeline would restart the typing.
  const signature = JSON.stringify(list)
  const timeline = useMemo(() => typingTimeline(JSON.parse(signature) as string[], { seed, stepMs }, loop), [signature, seed, stepMs, loop])
  const reduceMotion = useReducedMotion() ?? false
  const visualRef = useRef<HTMLSpanElement>(null)
  // A loop keeps watching so it can stop off screen; a single run only needs its first sighting.
  const seen = useInView(visualRef, { once: !loop, margin: VIEW_MARGIN })
  const held = useLoopHold(visualRef, loop && !reduceMotion)
  const running = loop ? seen && !held && !paused : trigger === "mount" || seen
  const runKey = `${variant}:${reduceMotion}`
  useTypewriterPlay({ visualRef, timeline, running, reduceMotion, runKey })

  return (
    <Tag
      {...props}
      data-slot="typewriter-text"
      data-variant={variant}
      data-effect={effect}
      // A loop lasts longer than five seconds, so keyboard users need a way to stop it too.
      tabIndex={loop ? 0 : props.tabIndex}
      className={cn("relative", ROOT_CLASS[variant], loop && "block rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
    >
      {/* Letters arriving one at a time would be read as stutter. A loop lists its phrases once. */}
      <span className="sr-only select-none">{list.join(", ")}</span>
      <span
        ref={visualRef}
        aria-hidden="true"
        data-slot="typewriter-text-visual"
        className={cn(variant === "block" && "inline-flex max-w-full gap-2", variant === "field" && FIELD_BOX)}
      >
        {/* Inside the observed element, because useInView keeps watching the node it first got. */}
        <VisualBody key={runKey} list={list} loop={loop} variant={variant} prompt={prompt} />
      </span>
    </Tag>
  )
}

export { TypewriterText, type TypewriterTextProps, type TypewriterTextVariant, type TypewriterTextEffect, type TypewriterTextTrigger }
