import type * as React from "react"
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { ANCHOR_CLASS, LINE_MARK, type HighlighterVariant } from "@/registry/miseui/ui/highlighter-marks"
import { lineSchedule, mergeLineRects, sameLines, scheduleSeconds, seedFromText, type LineRect } from "@/registry/miseui/ui/highlighter-math"
import { cn } from "@/registry/miseui/lib/utils"

type HighlighterEffect = "sequence"
type HighlighterTrigger = "view" | "mount"
type HighlighterGroupTag = "p" | "div" | "li" | "blockquote" | "span"

const VIEW_MARGIN = "0px 0px -10% 0px"
const INLINE_DISPLAYS: ReadonlySet<string> = new Set(["inline", "contents"])
const DEFAULT_SEED_TEXT = "mise"
/** A little past the last line's end, so a slow settle is never cut to a stop when marks switch to instant placement. */
const SETTLE_MARGIN_SECONDS = 0.6

interface GroupContextValue {
  /** Adds a mark and returns how to take it out again. */
  join: (element: HTMLElement) => () => void
  finish: (element: HTMLElement) => void
  started: boolean
  /** The mark whose turn it is. */
  current: HTMLElement | null
  finished: ReadonlySet<HTMLElement>
}

const GroupContext = createContext<GroupContextValue | null>(null)

/** A ResizeObserver reports nothing for an inline box, so it watches the block that decides where lines break. */
function closestBlock(element: HTMLElement): HTMLElement {
  const parent = element.parentElement
  if (!parent) return element
  return INLINE_DISPLAYS.has(getComputedStyle(parent).display) ? closestBlock(parent) : parent
}

/** The anchor is measured too: a Range gives viewport coordinates and the marks are placed from the anchor. */
function measureLines(anchor: HTMLElement, text: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(text)
  return mergeLineRects(Array.from(range.getClientRects()), anchor.getBoundingClientRect())
}

function useMeasuredLines(mark: HTMLElement | null, anchorRef: React.RefObject<HTMLElement | null>, textRef: React.RefObject<HTMLElement | null>) {
  const [lines, setLines] = useState<readonly LineRect[]>([])
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const text = textRef.current
    if (!mark || !anchor || !text) return
    const measure = () => {
      const next = measureLines(anchor, text)
      setLines((current) => (sameLines(current, next) ? current : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(closestBlock(mark))
    // Lines rebreak when a web font arrives, without the block changing size.
    const fonts = document.fonts
    fonts?.addEventListener("loadingdone", measure)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener("loadingdone", measure)
    }
  }, [mark, anchorRef, textRef])
  return lines
}

/** Joins the surrounding group, if any, and reports when this mark's turn has run. */
function useGroupTurn(mark: HTMLElement | null, totalSeconds: number) {
  const group = useContext(GroupContext)
  const join = group?.join
  const finish = group?.finish
  useLayoutEffect(() => {
    if (!join || !mark) return
    return join(mark)
  }, [join, mark])
  const active = group !== null && mark !== null && group.started && (group.current === mark || group.finished.has(mark))
  useEffect(() => {
    if (!finish || !mark || !active) return
    const timer = setTimeout(() => finish(mark), totalSeconds * 1000)
    return () => clearTimeout(timer)
  }, [finish, mark, active, totalSeconds])
  return { inGroup: group !== null, active }
}

type HighlighterTextProps = Omit<React.ComponentProps<"mark">, "ref"> & {
  /** `marker` a soft band swiped line by line, `underline` a thin line under each line, `sketch` a hand-drawn stroke, `box` a hand-drawn outline per line. */
  variant?: HighlighterVariant
  /** `view` draws once when first seen, `mount` right away. Inside a HighlighterGroup the group decides. */
  trigger?: HighlighterTrigger
  /** Seconds before drawing starts. */
  delay?: number
  /** Picks the shape of the hand-drawn strokes. Defaults to one derived from the text. */
  seed?: number
}

function HighlighterText({ variant = "marker", trigger = "view", delay = 0, seed, className, children, ...props }: HighlighterTextProps) {
  const reduceMotion = useReducedMotion() ?? false
  const markRef = useRef<HTMLElement>(null)
  // Also in state: the group and the measuring both have to run again once the element exists.
  const [mark, setMark] = useState<HTMLElement | null>(null)
  const attachMark = useCallback((element: HTMLElement | null) => {
    markRef.current = element
    setMark(element)
  }, [])
  const anchorRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const lines = useMeasuredLines(mark, anchorRef, textRef)
  const timings = useMemo(() => lineSchedule(lines).map((timing) => ({ ...timing, delay: timing.delay + delay })), [lines, delay])
  const seen = useInView(markRef, { once: true, margin: VIEW_MARGIN })
  const total = scheduleSeconds(timings)
  const { inGroup, active } = useGroupTurn(mark, total)
  const shown = reduceMotion || (inGroup ? active : trigger === "mount" || seen)
  // Once drawn, a resize only moves the marks. A line that appears from a rewrap must not draw itself again.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!shown || settled || lines.length === 0) return
    const timer = setTimeout(() => setSettled(true), (total + SETTLE_MARGIN_SECONDS) * 1000)
    return () => clearTimeout(timer)
  }, [shown, settled, total, lines.length])
  const textSeed = seed ?? seedFromText(typeof children === "string" ? children : DEFAULT_SEED_TEXT)
  const LineMark = LINE_MARK[variant]
  return (
    <mark
      {...props}
      ref={attachMark}
      data-slot="highlighter-text"
      data-variant={variant}
      data-drawn={shown ? "true" : "false"}
      // Isolate gives the marks a stacking context of their own, so -z-10 lands behind these letters and not behind the page.
      className={cn("isolate bg-transparent text-inherit forced-colors:bg-[Mark] forced-colors:text-[MarkText]", className)}
    >
      <span ref={anchorRef} aria-hidden="true" data-slot="highlighter-marks" className={ANCHOR_CLASS}>
        {lines.map((line, index) => (
          <LineMark key={index} line={line} timing={timings[index]} shown={shown} settled={settled || reduceMotion} seed={textSeed} index={index} />
        ))}
      </span>
      <span ref={textRef} data-slot="highlighter-words">
        {children}
      </span>
    </mark>
  )
}

/** Document order, not join order: a mark added later in the paragraph still takes its turn where it stands. */
function inDocumentOrder(elements: readonly HTMLElement[]) {
  return [...elements].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
}

type HighlighterGroupProps = React.HTMLAttributes<HTMLElement> & {
  as?: HighlighterGroupTag
  /** `view` starts the first mark when the group is seen, `mount` right away. */
  trigger?: HighlighterTrigger
}

/** The `sequence` effect: the marks inside draw one after another, in reading order, starting when the group is seen. */
function HighlighterGroup({ as: Tag = "p", trigger = "view", className, children, ...props }: HighlighterGroupProps) {
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref, { once: true, margin: VIEW_MARGIN })
  const started = trigger === "mount" || seen
  const [members, setMembers] = useState<readonly HTMLElement[]>([])
  const [finished, setFinished] = useState<ReadonlySet<HTMLElement>>(new Set())
  const join = useCallback((element: HTMLElement) => {
    setMembers((current) => inDocumentOrder([...current, element]))
    return () => setMembers((current) => current.filter((member) => member !== element))
  }, [])
  const finish = useCallback((element: HTMLElement) => setFinished((current) => new Set([...current, element])), [])
  const current = members.find((member) => !finished.has(member)) ?? null
  const context = useMemo<GroupContextValue>(() => ({ join, finish, started, current, finished }), [join, finish, started, current, finished])
  return (
    <GroupContext.Provider value={context}>
      {/* TypeScript cannot match one ref to a union of tags, and every tag here is an HTMLElement. */}
      <Tag {...props} ref={ref as React.RefObject<never>} data-slot="highlighter-group" data-effect="sequence" className={className}>
        {children}
      </Tag>
    </GroupContext.Provider>
  )
}

export { HighlighterGroup, HighlighterText, type HighlighterEffect, type HighlighterGroupProps, type HighlighterTextProps, type HighlighterTrigger, type HighlighterVariant }
