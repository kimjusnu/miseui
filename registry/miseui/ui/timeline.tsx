import type * as React from "react"
import { DEFAULT_TIMELINE_LABELS, LIST, type TimelineEvent, type TimelineLabels, type TimelineVariant } from "@/registry/miseui/ui/timeline-lists"
import type { TimelineStatus } from "@/registry/miseui/ui/timeline-parts"
import { cn } from "@/registry/miseui/lib/utils"

type TimelineEffect = "draw"

type TimelineProps = Omit<React.ComponentProps<"div">, "children" | "aria-label"> & {
  /** In the order they should read. */
  events: readonly TimelineEvent[]
  /** `vertical` a rail with details, `alternate` two sides on a wide container and one on a narrow one, `compact` one line per event, `horizontal` a row that scrolls inside itself. */
  variant?: TimelineVariant
  /** `draw` grows each stretch of the line as it scrolls into view. */
  effect?: TimelineEffect
  /** Names the list; `horizontal` needs it, because its scroller is a focus stop. */
  "aria-label"?: string
  labels?: Partial<TimelineLabels>
}

function Timeline({ events, variant = "vertical", effect, "aria-label": label, labels, className, ...props }: TimelineProps) {
  const List = LIST[variant]
  return (
    <div
      data-slot="timeline"
      data-variant={variant}
      data-effect={effect}
      // The column template is what lets a scrolling child shrink instead of pushing the root to its full length.
      className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)]", className)}
      {...props}
    >
      <List events={events} draw={effect === "draw"} labels={{ ...DEFAULT_TIMELINE_LABELS, ...labels }} label={label} />
    </div>
  )
}

export { Timeline, type TimelineProps, type TimelineEvent, type TimelineVariant, type TimelineEffect, type TimelineStatus, type TimelineLabels }
