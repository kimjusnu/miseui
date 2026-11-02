import type * as React from "react"

interface HoverCardFact {
  label: React.ReactNode
  value: React.ReactNode
}

interface HoverCardProfileBody {
  variant: "profile"
  name: React.ReactNode
  handle?: React.ReactNode
  /** Usually an Avatar. */
  avatar?: React.ReactNode
  bio?: React.ReactNode
  /** Short numbers along the bottom, such as followers or repositories. */
  facts?: readonly HoverCardFact[]
}

interface HoverCardLinkPreviewBody {
  variant: "link-preview"
  title: React.ReactNode
  description?: React.ReactNode
  /** Where the link goes, shown last so the title is read first. */
  domain?: React.ReactNode
  /** Bleeds to the edges of the card. An image or your own drawing. */
  media?: React.ReactNode
}

interface HoverCardStatBody {
  variant: "stat"
  label: React.ReactNode
  value: React.ReactNode
  /** The comparison that gives the number its meaning, such as "up 12% on last week". */
  change?: React.ReactNode
  /** Drawn as a sparkline. Needs at least two values. */
  trend?: readonly number[]
}

const TREND_WIDTH = 192
const TREND_HEIGHT = 32
/** Keeps the stroke from being clipped at the top and bottom of the box. */
const TREND_INSET = 2

/** Polyline points for a trend. A flat series sits on the middle line instead of dividing by zero. */
function sparklinePoints(values: readonly number[], width: number, height: number, inset = TREND_INSET) {
  if (values.length < 2) return ""
  const low = Math.min(...values)
  const range = Math.max(...values) - low
  const usable = height - inset * 2
  return values
    .map((entry, index) => {
      const x = (index / (values.length - 1)) * width
      const y = range === 0 ? height / 2 : inset + usable - ((entry - low) / range) * usable
      return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`
    })
    .join(" ")
}

function ProfileBody({ name, handle, avatar, bio, facts }: HoverCardProfileBody) {
  return (
    <div data-part="profile" className="grid gap-3">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {handle ? <p className="truncate text-[13px] text-muted-foreground">{handle}</p> : null}
        </div>
      </div>
      {bio ? <p className="text-[13px] leading-5 text-muted-foreground">{bio}</p> : null}
      {facts && facts.length > 0 ? (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {facts.map((fact, index) => (
            <div key={index} className="flex flex-row-reverse items-baseline gap-1">
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

function LinkPreviewBody({ title, description, domain, media }: HoverCardLinkPreviewBody) {
  return (
    <div data-part="link-preview">
      {media ? (
        <div data-part="media" className="aspect-2/1 overflow-hidden border-b bg-muted [&>img]:size-full [&>img]:object-cover">
          {media}
        </div>
      ) : null}
      <div className="grid gap-1 p-4">
        <p className="line-clamp-2 text-sm font-medium">{title}</p>
        {description ? <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">{description}</p> : null}
        {domain ? <p className="pt-1 text-xs text-muted-foreground">{domain}</p> : null}
      </div>
    </div>
  )
}

function StatBody({ label, value, change, trend }: HoverCardStatBody) {
  const points = trend ? sparklinePoints(trend, TREND_WIDTH, TREND_HEIGHT) : ""
  return (
    <div data-part="stat" className="grid gap-1">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {change ? <p className="text-[13px] text-muted-foreground">{change}</p> : null}
      {points ? (
        <svg
          aria-hidden="true"
          data-part="trend"
          viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
          preserveAspectRatio="none"
          className="mt-2 h-8 w-full"
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="text-mise"
          />
        </svg>
      ) : null}
    </div>
  )
}

export {
  LinkPreviewBody,
  ProfileBody,
  StatBody,
  sparklinePoints,
  type HoverCardFact,
  type HoverCardLinkPreviewBody,
  type HoverCardProfileBody,
  type HoverCardStatBody,
}
