import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

type SelectEffect = "materialize" | "spring"

/** The enter and exit values stay unqualified so the media overrides below win on source order. */
const SELECT_MATERIALIZE_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "fade-in-0 zoom-in-90 blur-in-sm fade-out-0 zoom-out-90 blur-out-sm",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

/** One stacking context for the list keeps a flying highlight behind every label, not just its own. */
const SELECT_SPRING_CONTENT_CLASS = "isolate"
const SELECT_SPRING_ITEM_CLASS = "focus:bg-transparent focus:text-foreground"

const SelectSpringContext = createContext<{ reduceMotion: boolean } | null>(null)

function SelectSpringScope({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  // layoutId is global to the page; without a per-instance group two open lists would share one highlight.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const value = useMemo(() => ({ reduceMotion }), [reduceMotion])
  if (!enabled) return children
  return (
    <SelectSpringContext.Provider value={value}>
      <LayoutGroup id={groupId}>{children}</LayoutGroup>
    </SelectSpringContext.Provider>
  )
}

interface FocusHandlers {
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
}

/** Radix highlights an item by focusing it, for the keyboard and the pointer alike, so focus is the one signal needed. */
function useSelectItemHighlight({ onFocus, onBlur }: FocusHandlers) {
  const scope = useContext(SelectSpringContext)
  const [focused, setFocused] = useState(false)
  if (!scope) return { spring: false, highlighted: false, reduceMotion: false, onFocus, onBlur }
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

function SelectHighlight({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="select-highlight"
      data-reduced={reduceMotion ? "true" : "false"}
      layoutId={reduceMotion ? undefined : "select-highlight"}
      transition={SPRING_DEFAULT}
      className="absolute inset-0 -z-10 rounded-sm bg-mise-soft"
    />
  )
}

export {
  SELECT_MATERIALIZE_CLASS,
  SELECT_SPRING_CONTENT_CLASS,
  SELECT_SPRING_ITEM_CLASS,
  SelectHighlight,
  SelectSpringScope,
  useSelectItemHighlight,
  type SelectEffect,
}
