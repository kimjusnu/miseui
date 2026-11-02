import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type DropdownMenuEffect = "materialize" | "spring"
type HighlightVariant = "default" | "destructive"

/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const MENU_MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-90 blur-in-sm fade-out-0 zoom-out-90 blur-out-sm",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

/** One stacking context for the menu keeps a flying highlight behind every label and above the surface colour. */
const MENU_SPRING_CONTENT_CLASS = "isolate"

/** Clears every item background so the sliding highlight is the only one drawn. */
const MENU_SPRING_ITEM_CLASS = [
  "focus:bg-transparent focus:text-foreground",
  "data-[variant=destructive]:focus:bg-transparent data-[variant=destructive]:focus:text-destructive",
  "dark:data-[variant=destructive]:focus:bg-transparent",
]

const HIGHLIGHT_COLOR_CLASS: Record<HighlightVariant, string> = {
  default: "bg-mise-soft",
  destructive: "bg-destructive/10 dark:bg-destructive/20",
}

const MenuSpringContext = createContext<{ reduceMotion: boolean } | null>(null)

function MenuSpringScope({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  // layoutId is global to the page; without a per-instance group two open menus would share one highlight.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const value = useMemo(() => ({ reduceMotion }), [reduceMotion])
  if (!enabled) return children
  return (
    <MenuSpringContext.Provider value={value}>
      <LayoutGroup id={groupId}>{children}</LayoutGroup>
    </MenuSpringContext.Provider>
  )
}

interface ItemHighlightOptions {
  asChild?: boolean
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
}

/** Radix highlights an item by focusing it, for the keyboard and the pointer alike, so focus is the one signal needed. */
function useMenuItemHighlight({ asChild, onFocus, onBlur }: ItemHighlightOptions) {
  const scope = useContext(MenuSpringContext)
  const [focused, setFocused] = useState(false)
  // A Slot takes exactly one child, so an asChild item keeps the plain focus background instead of a highlight.
  if (!scope || asChild) return { spring: false, highlighted: false, reduceMotion: false, onFocus, onBlur }
  return {
    spring: true,
    highlighted: focused,
    reduceMotion: scope.reduceMotion,
    onFocus: (event: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(event)
      setFocused(true)
    },
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      onBlur?.(event)
      setFocused(false)
    },
  }
}

function MenuHighlight({ variant, reduceMotion }: { variant: HighlightVariant; reduceMotion: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="dropdown-menu-highlight"
      data-reduced={reduceMotion ? "true" : "false"}
      layoutId={reduceMotion ? undefined : "dropdown-menu-highlight"}
      transition={SPRING_DEFAULT}
      className={cn("absolute inset-0 -z-10 rounded-sm", HIGHLIGHT_COLOR_CLASS[variant])}
    />
  )
}

export {
  MENU_MATERIALIZE_CLASS,
  MENU_SPRING_CONTENT_CLASS,
  MENU_SPRING_ITEM_CLASS,
  MenuHighlight,
  MenuSpringScope,
  useMenuItemHighlight,
  type DropdownMenuEffect,
}
