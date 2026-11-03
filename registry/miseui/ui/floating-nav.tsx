import type * as React from "react"
import { useId, useState } from "react"
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { IslandView } from "@/registry/miseui/ui/floating-nav-island"
import { useNavScroll, type FloatingNavItem } from "@/registry/miseui/ui/floating-nav-state"
import { BarView, PillView, TabsView, type NavViewProps } from "@/registry/miseui/ui/floating-nav-views"
import { cn } from "@/registry/miseui/lib/utils"

type FloatingNavVariant = "pill" | "island" | "bar" | "tabs"
type FloatingNavEffect = "hide"
type FloatingNavPosition = "fixed" | "sticky" | "absolute"

type Edge = "floating" | "flush" | "bottom"

const EDGE: Record<FloatingNavVariant, Edge> = { pill: "floating", island: "floating", bar: "flush", tabs: "bottom" }

const POSITION_CLASS: Record<FloatingNavPosition, Record<Edge, string>> = {
  fixed: { floating: "fixed inset-x-0 top-4", flush: "fixed inset-x-0 top-0", bottom: "fixed inset-x-0 bottom-0" },
  sticky: { floating: "sticky top-2", flush: "sticky top-0", bottom: "sticky bottom-0" },
  absolute: { floating: "absolute inset-x-0 top-2", flush: "absolute inset-x-0 top-0", bottom: "absolute inset-x-0 bottom-0" },
}

/** Far enough to clear its own offset from the edge. */
const HIDDEN_Y: Record<Edge, string> = { floating: "-160%", flush: "-110%", bottom: "110%" }

type FloatingNavProps = Omit<React.ComponentProps<"nav">, "onSelect" | "aria-label"> & {
  /** Names the landmark. */
  label: string
  items: readonly FloatingNavItem[]
  /** The current item, for a controlled nav. Usually read from the router. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** `pill` links with a sliding highlight, `island` a capsule that opens into a panel, `bar` a top bar that shrinks into a pill, `tabs` a bottom tab bar. */
  variant?: FloatingNavVariant
  /** `hide` leaves on scroll down and returns on scroll up, near the top, and when focus lands inside. */
  effect?: FloatingNavEffect
  /** How it floats. Use `sticky` or `absolute` with `scrollContainer` inside a small scroller. */
  position?: FloatingNavPosition
  /** The element that scrolls, when it is not the window. */
  scrollContainer?: React.RefObject<HTMLElement | null>
  /** Shown by `bar` and `island`. */
  brand?: React.ReactNode
  /** Shown by `bar`. */
  actions?: React.ReactNode
}

function NavView({ variant, compact, ...view }: NavViewProps & { variant: FloatingNavVariant; compact: boolean }) {
  if (variant === "island") return <IslandView {...view} />
  if (variant === "bar") return <BarView {...view} compact={compact} />
  if (variant === "tabs") return <TabsView {...view} />
  return <PillView {...view} />
}

function FloatingNav({
  label,
  items,
  value,
  defaultValue,
  onValueChange,
  variant = "pill",
  effect,
  position = "fixed",
  scrollContainer,
  brand,
  actions,
  className,
  onFocus,
  onBlur,
  ...props
}: FloatingNavProps) {
  // layoutId is global to the page; without a per-instance group two navs would fight over one highlight.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.value)
  const [focusInside, setFocusInside] = useState(false)
  const { hidden, compact } = useNavScroll(scrollContainer, effect === "hide" || variant === "bar")
  // A hidden nav stays in the tab order on purpose: a Tab landing in it brings it back instead of focusing something unseen.
  const away = effect === "hide" && hidden && !focusInside
  const edge = EDGE[variant]
  const view = {
    label,
    items,
    current: value !== undefined ? value : uncontrolled,
    onSelect: (next: string) => {
      setUncontrolled(next)
      onValueChange?.(next)
    },
    brand,
    actions,
  }
  return (
    <nav
      data-slot="floating-nav"
      data-variant={variant}
      data-effect={effect}
      data-position={position}
      data-hidden={away ? "true" : "false"}
      aria-label={label}
      // The empty sides of a centred pill must not catch clicks meant for the page.
      className={cn("pointer-events-none z-40 flex min-w-0 justify-center", POSITION_CLASS[position][edge], className)}
      onFocus={(event) => {
        setFocusInside(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false)
        onBlur?.(event)
      }}
      {...props}
    >
      <MotionConfig transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}>
        <LayoutGroup id={groupId}>
          <motion.div
            data-slot="floating-nav-mover"
            initial={false}
            animate={{ y: away ? HIDDEN_Y[edge] : 0 }}
            className={cn("flex w-full min-w-0 justify-center", away && "**:pointer-events-none!")}
          >
            <NavView variant={variant} compact={compact} {...view} />
          </motion.div>
        </LayoutGroup>
      </MotionConfig>
    </nav>
  )
}

export { FloatingNav, type FloatingNavProps, type FloatingNavItem, type FloatingNavVariant, type FloatingNavEffect, type FloatingNavPosition }
