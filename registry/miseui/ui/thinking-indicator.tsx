import type * as React from "react"
import { Check, TriangleAlert } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"

type ThinkingState = "thinking" | "searching" | "writing" | "done" | "error"
type ThinkingSize = "sm" | "md" | "lg"

const DEFAULT_LABELS: Record<ThinkingState, string> = {
  thinking: "Thinking…",
  searching: "Searching…",
  writing: "Writing…",
  done: "Done",
  error: "Something went wrong",
}

const ACTIVE_STATES: readonly ThinkingState[] = ["thinking", "searching", "writing"]
const DOT_COUNT = 3
/** One full breath per dot. Under a second so the wait never feels frozen. */
const PULSE_SECONDS = 0.9
const DOT_STAGGER_SECONDS = 0.15
const REDUCED_MOTION_BASE_OPACITY = 0.4
const REDUCED_MOTION_OPACITY_STEP = 0.25

const SIZE_CLASSES: Record<ThinkingSize, { dot: string; text: string; icon: string; gap: string }> = {
  sm: { dot: "size-1.5", text: "text-xs", icon: "size-3.5", gap: "gap-1" },
  md: { dot: "size-2", text: "text-sm", icon: "size-4", gap: "gap-1.5" },
  lg: { dot: "size-2.5", text: "text-base", icon: "size-5", gap: "gap-2" },
}

interface ThinkingIndicatorProps extends React.ComponentProps<"div"> {
  /** What the model is doing right now. Active states show breathing dots. */
  state?: ThinkingState
  /** Name the work ("Reading 3 files…"). Falls back to a label for the state. */
  label?: string
  size?: ThinkingSize
}

function ThinkingIndicator({
  state = "thinking",
  label,
  size = "md",
  className,
  ...props
}: ThinkingIndicatorProps) {
  const isActive = ACTIVE_STATES.includes(state)
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="thinking-indicator"
      data-state={state}
      className={cn(
        "inline-flex items-center gap-2.5 text-muted-foreground",
        sizeClass.text,
        state === "done" && "text-foreground",
        state === "error" && "text-destructive",
        className,
      )}
      {...props}
    >
      {isActive ? (
        <BreathingDots dotClassName={sizeClass.dot} gapClassName={sizeClass.gap} />
      ) : (
        <StateIcon state={state} className={sizeClass.icon} />
      )}
      <span>{label ?? DEFAULT_LABELS[state]}</span>
    </div>
  )
}

function BreathingDots({ dotClassName, gapClassName }: { dotClassName: string; gapClassName: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <span className={cn("flex items-center", gapClassName)} aria-hidden="true">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <motion.span
          key={index}
          data-testid="thinking-dot"
          className={cn("rounded-full bg-mise", dotClassName)}
          initial={false}
          animate={
            reduceMotion
              ? { opacity: REDUCED_MOTION_BASE_OPACITY + index * REDUCED_MOTION_OPACITY_STEP }
              : { scale: [1, 1.5, 1], opacity: [0.45, 1, 0.45] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: PULSE_SECONDS,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * DOT_STAGGER_SECONDS,
                }
          }
        />
      ))}
    </span>
  )
}

function StateIcon({ state, className }: { state: ThinkingState; className: string }) {
  if (state === "done") return <Check className={className} aria-hidden="true" />
  if (state === "error") return <TriangleAlert className={className} aria-hidden="true" />
  return null
}

export { ThinkingIndicator, type ThinkingIndicatorProps, type ThinkingState }
