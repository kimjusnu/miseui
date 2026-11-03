import type * as React from "react"
import { STATUS_TEXT_CLASS, TimelineConnector, TimelineDot, TimelineMarker, type TimelineStatus } from "@/registry/miseui/ui/timeline-parts"
import { cn } from "@/registry/miseui/lib/utils"

type TimelineVariant = "vertical" | "alternate" | "compact" | "horizontal"

interface TimelineEvent {
  /** Stable key. Falls back to the position, which is fine for a list that only grows at the end. */
  id?: string
  /** What people read, such as "Today, 09:12". */
  time: React.ReactNode
  /** The machine-readable moment, for the time element. */
  dateTime?: string
  title: React.ReactNode
  /** Shown by every variant except `compact`, which keeps to one line. */
  body?: React.ReactNode
  status?: TimelineStatus
  /** Replaces the status mark. The status is still announced. */
  icon?: React.ReactNode
}

type TimelineLabels = Record<Exclude<TimelineStatus, "neutral">, string>

const DEFAULT_TIMELINE_LABELS: TimelineLabels = {
  current: "In progress",
  success: "Done",
  warning: "Needs attention",
  error: "Failed",
}

const TIME_CLASS = "text-[13px] leading-6 text-muted-foreground tabular-nums"
const TITLE_CLASS = "text-sm leading-5 font-medium text-foreground wrap-break-word"
const BODY_CLASS = "text-[13px] leading-5 text-muted-foreground wrap-break-word"

function EventTime({ event, className }: { event: TimelineEvent; className?: string }) {
  return (
    <time dateTime={event.dateTime} className={cn(TIME_CLASS, className)}>
      {event.time}
    </time>
  )
}

function SpokenStatus({ status, labels }: { status: TimelineStatus; labels: TimelineLabels }) {
  if (status === "neutral") return null
  return <span className="sr-only">{labels[status]}: </span>
}

function EventText({ event, labels, className }: { event: TimelineEvent; labels: TimelineLabels; className?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-1", className)}>
      <p className={TITLE_CLASS}>
        <SpokenStatus status={event.status ?? "neutral"} labels={labels} />
        {event.title}
      </p>
      {event.body ? <p className={BODY_CLASS}>{event.body}</p> : null}
    </div>
  )
}

interface ListProps {
  events: readonly TimelineEvent[]
  draw: boolean
  labels: TimelineLabels
  label?: string
}

function VerticalList({ events, draw, labels, label }: ListProps) {
  return (
    <ol aria-label={label} data-slot="timeline-list" className="grid min-w-0">
      {events.map((event, index) => (
        <li key={event.id ?? index} className="relative flex min-w-0 gap-3 pb-6 last:pb-0">
          {/* Stops short of both markers, so neither needs an opaque fill that would have to match the surface behind it. */}
          {index < events.length - 1 ? <TimelineConnector axis="y" draw={draw} className="absolute start-[11.5px] top-7 bottom-1 w-px" /> : null}
          <TimelineMarker status={event.status ?? "neutral"} icon={event.icon} />
          <div className="grid min-w-0 flex-1">
            <EventTime event={event} />
            <EventText event={event} labels={labels} />
          </div>
        </li>
      ))}
    </ol>
  )
}

/** One column until the container reaches 512 px. Container, not viewport: a wide screen may still give it a narrow column. */
function AlternateList({ events, draw, labels, label }: ListProps) {
  return (
    <ol aria-label={label} data-slot="timeline-list" className="grid min-w-0">
      {events.map((event, index) => {
        const contentRight = index % 2 === 0
        return (
          <li
            key={event.id ?? index}
            data-side={contentRight ? "right" : "left"}
            className="relative grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0 @lg:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)] @lg:gap-x-6"
          >
            {index < events.length - 1 ? (
              <TimelineConnector axis="y" draw={draw} className="absolute start-[11.5px] top-7 bottom-1 w-px @lg:start-1/2 @lg:-translate-x-1/2" />
            ) : null}
            <span className="col-start-1 row-span-2 row-start-1 @lg:col-start-2">
              <TimelineMarker status={event.status ?? "neutral"} icon={event.icon} />
            </span>
            <EventTime event={event} className={cn("col-start-2 row-start-1", contentRight ? "@lg:col-start-1 @lg:text-right" : "@lg:col-start-3")} />
            <EventText
              event={event}
              labels={labels}
              // On two sides the title shares a row with the time on the far side, so they take the same line height.
              className={cn("col-start-2 row-start-2 @lg:[&>p:first-child]:leading-6", contentRight ? "@lg:col-start-3 @lg:row-start-1" : "@lg:col-start-1 @lg:row-start-1 @lg:text-right")}
            />
          </li>
        )
      })}
    </ol>
  )
}

function CompactList({ events, draw, labels, label }: ListProps) {
  return (
    <ol aria-label={label} data-slot="timeline-list" className="grid min-w-0">
      {events.map((event, index) => {
        const status = event.status ?? "neutral"
        return (
          <li key={event.id ?? index} className="relative grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-x-2 py-1.5">
            {index < events.length - 1 ? <TimelineConnector axis="y" draw={draw} className="absolute start-[7.5px] top-[22px] -bottom-2.5 w-px" /> : null}
            <TimelineDot status={status} />
            <p className="min-w-0 text-[13px] leading-5 wrap-break-word text-foreground">
              {event.title}
              {/* Colour alone cannot carry the status on a dot this small, so it is also written out. */}
              {status === "neutral" ? null : <span className={cn("ms-2 font-medium", STATUS_TEXT_CLASS[status])}>{labels[status]}</span>}
            </p>
            <EventTime event={event} className="leading-5" />
          </li>
        )
      })}
    </ol>
  )
}

function HorizontalList({ events, draw, labels, label }: ListProps) {
  return (
    // Focusable because a scroller that only a mouse can move is out of reach for the keyboard. Not rounded: a clip would cut the ends of the line.
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      data-slot="timeline-scroller"
      className="min-w-0 snap-x snap-proximity overflow-x-auto pb-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <ol data-slot="timeline-list" className="flex w-max min-w-full">
        {events.map((event, index) => (
          <li key={event.id ?? index} className="relative grid w-44 shrink-0 snap-start content-start gap-2 pe-4 last:pe-0">
            {index < events.length - 1 ? <TimelineConnector axis="x" draw={draw} className="absolute start-7 end-1 top-[11.5px] h-px" /> : null}
            <TimelineMarker status={event.status ?? "neutral"} icon={event.icon} />
            <div className="grid min-w-0">
              <EventTime event={event} />
              <EventText event={event} labels={labels} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const LIST: Record<TimelineVariant, (props: ListProps) => React.ReactNode> = {
  vertical: VerticalList,
  alternate: AlternateList,
  compact: CompactList,
  horizontal: HorizontalList,
}

export { DEFAULT_TIMELINE_LABELS, LIST, type TimelineEvent, type TimelineLabels, type TimelineVariant }
