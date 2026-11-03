import type * as React from "react"
import { useRef, useState } from "react"
import { Toolbar as ToolbarPrimitive } from "radix-ui"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  ActionBarAction,
  ActionBarClear,
  ActionBarSeparator,
  ActionBarVariantContext,
  DEFAULT_POSITION,
  FIXED_POSITIONER_CLASS,
  INLINE_POSITIONER_CLASS,
  SURFACE_CLASS,
  type ActionBarActionProps,
  type ActionBarActionTone,
  type ActionBarPosition,
  type ActionBarVariant,
} from "@/registry/miseui/ui/action-bar-parts"
import { shouldClearOnEscape, useEscapeToClear, useFocusReturn } from "@/registry/miseui/ui/action-bar-state"
import { cn } from "@/registry/miseui/lib/utils"

type ActionBarEffect = "spring"

/** A fixed bar has to clear the screen edge, its own height included; an inline bar only needs a hint of direction. */
const TRAVEL_PX: Record<ActionBarPosition, number> = { fixed: 72, inline: 8 }

const COUNT_CLASS = "whitespace-nowrap text-sm font-medium tabular-nums"

interface BarBodyProps {
  variant: ActionBarVariant
  count: number
  countText: React.ReactNode
  clearLabel: string
  onClear: () => void
  children: React.ReactNode
}

/** Same three things in every variant; the order is what differs, because each one reads from a different place. */
function BarBody({ variant, count, countText, clearLabel, onClear, children }: BarBodyProps) {
  const visibleCount = <span aria-hidden="true" data-slot="action-bar-count" className={cn(COUNT_CLASS, "px-2")}>{countText}</span>
  const clearIcon = <ActionBarClear label={clearLabel} wide={false} onClick={onClear} />
  if (variant === "floating") {
    return (
      <>
        {clearIcon}
        {visibleCount}
        <ActionBarSeparator />
        {children}
      </>
    )
  }
  if (variant === "docked") {
    return (
      <>
        {visibleCount}
        <ActionBarClear label={clearLabel} wide onClick={onClear} />
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1">{children}</div>
      </>
    )
  }
  if (variant === "inline") {
    return (
      <>
        <span aria-hidden="true" data-slot="action-bar-count" className={COUNT_CLASS}>{countText}</span>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
          {children}
          {clearIcon}
        </div>
      </>
    )
  }
  return (
    <>
      <span aria-hidden="true" data-slot="action-bar-count" className={cn(COUNT_CLASS, "min-w-8 text-center")}>{count}</span>
      {children}
      {clearIcon}
    </>
  )
}

type ActionBarProps = Omit<React.ComponentProps<"div">, "children" | "dir"> & {
  /** How many items are selected. The bar shows above zero. */
  count: number
  /** Called by the clear button and by Escape. */
  onClear: () => void
  /** ActionBarAction buttons. */
  children: React.ReactNode
  /** `floating` an island over the page, `docked` a full-width footer, `inline` a tinted row in the flow, `compact` a small dark pill of glyphs. */
  variant?: ActionBarVariant
  /** `fixed` sits on the viewport, `inline` in the flow. `floating` and `docked` default to fixed, the others to inline. */
  position?: ActionBarPosition
  /** `spring` brings the bar in from the bottom and sends it back the same way. */
  effect?: ActionBarEffect
  /** Name of the toolbar for assistive tech. */
  label?: string
  /** What the count says, here and to screen readers. */
  countLabel?: (count: number) => string
  clearLabel?: string
  /** Where focus goes when the bar closes. Defaults to where it came from. */
  returnFocusRef?: React.RefObject<HTMLElement | null>
  /** Limits Escape to focus inside this element, for several bars on one page. Defaults to the whole page. */
  escapeScopeRef?: React.RefObject<HTMLElement | null>
}

const defaultCountLabel = (count: number) => `${count} selected`

/** Everything else on the props is an attribute of the toolbar. */
const OWN_PROPS: ReadonlySet<string> = new Set([
  "count", "onClear", "children", "variant", "position", "effect", "label", "countLabel", "clearLabel", "returnFocusRef", "escapeScopeRef", "className",
])

function toolbarAttributes(props: ActionBarProps) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !OWN_PROPS.has(key)))
}

function ActionBar(allProps: ActionBarProps) {
  const { count, onClear, children, variant = "floating", position, effect, label = "Selection actions", className } = allProps
  const { countLabel = defaultCountLabel, clearLabel = "Clear selection", returnFocusRef, escapeScopeRef } = allProps
  const props = toolbarAttributes(allProps)
  const open = count > 0
  const resolvedPosition = position ?? DEFAULT_POSITION[variant]
  const reduceMotion = useReducedMotion() ?? false
  const barRef = useRef<HTMLDivElement>(null)
  // The bar animates out after the count reached zero. It should leave saying what it said, not "0 selected".
  const [lastCount, setLastCount] = useState(count)
  if (open && count !== lastCount) setLastCount(count)
  const noteFocusOrigin = useFocusReturn(open, barRef, returnFocusRef)
  useEscapeToClear({ open, onClear, barRef, scopeRef: escapeScopeRef })

  const away = reduceMotion ? { opacity: 0 } : { opacity: 0, y: TRAVEL_PX[resolvedPosition] }
  const motionProps = effect === "spring" ? { initial: away, exit: away } : { initial: false as const }
  const positioner = resolvedPosition === "fixed" ? FIXED_POSITIONER_CLASS[variant] : INLINE_POSITIONER_CLASS[variant]
  return (
    <div data-slot="action-bar" data-variant={variant} data-position={resolvedPosition} data-effect={effect} data-state={open ? "open" : "closed"} className="contents">
      {/* Outside the presence so it is in the page before the first count, which is what makes it get announced. */}
      <span role="status" className="sr-only">{open ? countLabel(count) : ""}</span>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div key="bar" data-slot="action-bar-positioner" className={positioner} animate={{ opacity: 1, y: 0 }} transition={SPRING_DEFAULT} {...motionProps}>
            <ActionBarVariantContext.Provider value={variant}>
              <ToolbarPrimitive.Root ref={barRef} aria-label={label} data-slot="action-bar-surface" onFocus={noteFocusOrigin} className={cn(SURFACE_CLASS[variant], className)} {...props}>
                <BarBody {...{ variant, onClear, clearLabel }} count={lastCount} countText={countLabel(lastCount)}>
                  {children}
                </BarBody>
              </ToolbarPrimitive.Root>
            </ActionBarVariantContext.Provider>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export {
  ActionBar,
  ActionBarAction,
  shouldClearOnEscape,
  type ActionBarProps,
  type ActionBarActionProps,
  type ActionBarActionTone,
  type ActionBarVariant,
  type ActionBarPosition,
  type ActionBarEffect,
}
