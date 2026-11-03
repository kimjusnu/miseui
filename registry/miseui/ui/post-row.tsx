import type * as React from "react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

type PostRowVariant = "line" | "stacked" | "ledger"
type PostRowEffect = "nudge"

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * "2026-11-03" means that calendar day, but new Date reads it as UTC midnight, which is still the 2nd in the Americas.
 * Date-only strings therefore format in UTC, so nobody sees yesterday's date.
 */
function formatPostDate(date: string | Date, locale?: string) {
  const dateOnly = typeof date === "string" && DATE_ONLY.test(date)
  const parsed = new Date(dateOnly ? `${date}T00:00:00Z` : date)
  if (Number.isNaN(parsed.getTime())) return { label: String(date), dateTime: undefined }
  const label = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: dateOnly ? "UTC" : undefined }).format(parsed)
  return { label, dateTime: dateOnly ? (date as string) : parsed.toISOString() }
}

const ROOT_CLASS: Record<PostRowVariant, string> = {
  line: "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3",
  stacked: "grid grid-cols-[minmax(0,1fr)] gap-1 py-4",
  // Wide enough for a medium date in the common locales, and it may still wrap rather than push the title out.
  ledger: "grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 py-3",
}

const TITLE_CLASS: Record<PostRowVariant, string> = {
  line: "text-sm font-medium",
  stacked: "text-[15px] font-medium",
  ledger: "text-sm font-medium",
}

const NUDGE_CLASS =
  "transition-transform duration-(--duration-base) ease-(--ease-mise) group-hover/post:translate-x-1 rtl:group-hover/post:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/post:translate-x-0"

function PostTitle({ variant, effect, kicker, children }: { variant: PostRowVariant; effect?: PostRowEffect; kicker?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span data-slot="post-row-title" className={cn("block min-w-0 leading-5 wrap-break-word text-foreground", TITLE_CLASS[variant], effect === "nudge" && NUDGE_CLASS)}>
      {kicker ? <span className="me-2 text-xs font-normal text-muted-foreground">{kicker}</span> : null}
      <span className="decoration-border underline-offset-4 group-hover/post:underline">{children}</span>
      {effect === "nudge" ? (
        // Takes its room at rest, so the line never reflows when it fades in.
        <ArrowUpRight aria-hidden="true" data-slot="post-row-arrow" className="ms-1 inline-block size-3.5 align-[-2px] text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-mise) group-hover/post:opacity-100" />
      ) : null}
    </span>
  )
}

function PostTags({ tags }: { tags?: readonly string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <span data-slot="post-row-tags" className="flex min-w-0 flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="rounded-sm bg-muted px-1 text-xs leading-5 text-muted-foreground">
          {tag}
        </span>
      ))}
    </span>
  )
}

type PostRowProps = Omit<React.ComponentProps<"a">, "title"> & {
  title: React.ReactNode
  /** A Date or an ISO string. A date-only string is shown as that calendar day in every time zone. */
  date: string | Date
  tags?: readonly string[]
  /** A short type label in front of the title, such as "Note". */
  kicker?: React.ReactNode
  /** A sentence or two under the title. Only `stacked` has room for it. */
  excerpt?: React.ReactNode
  /** A few words beside the date, such as "6 min read". */
  meta?: React.ReactNode
  locale?: string
  /** `line` title and date on one baseline, `stacked` a title with a summary, `ledger` a date column for archives. */
  variant?: PostRowVariant
  /** `nudge` moves the title a little towards where the link goes, and shows an arrow. */
  effect?: PostRowEffect
  /** Your router's link. It receives `href` and the rest. */
  as?: React.ElementType
}

interface LayoutProps {
  variant: PostRowVariant
  heading: React.ReactNode
  time: React.ReactNode
  tags: React.ReactNode
  excerpt: React.ReactNode
  extra: React.ReactNode
}

function PostLayout({ variant, heading, time, tags, excerpt, extra }: LayoutProps) {
  const titled = (
    <span className="grid min-w-0 gap-1">
      {heading}
      {tags}
    </span>
  )
  if (variant === "ledger") {
    return (
      <>
        {time}
        {titled}
      </>
    )
  }
  if (variant === "line") {
    return (
      <>
        {titled}
        <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
          {extra ? <span className="max-sm:hidden">{extra}</span> : null}
          {time}
        </span>
      </>
    )
  }
  return (
    <>
      {heading}
      {excerpt ? <span data-slot="post-row-excerpt" className="text-[13px] leading-5 text-pretty text-muted-foreground">{excerpt}</span> : null}
      <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {time}
        {extra}
        {tags}
      </span>
    </>
  )
}

function PostRow({ title, date, tags, kicker, excerpt, meta, locale, variant = "line", effect, as: Root = "a", className, ...props }: PostRowProps) {
  const { label, dateTime } = formatPostDate(date, locale)
  return (
    <Root
      data-slot="post-row"
      data-variant={variant}
      data-effect={effect}
      className={cn(
        "group/post min-w-0 border-b text-start outline-none [li:last-child>&]:border-b-0",
        "transition-opacity duration-(--duration-fast) ease-(--ease-mise) active:opacity-70 active:duration-0",
        "focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
        ROOT_CLASS[variant],
        className,
      )}
      {...props}
    >
      <PostLayout
        variant={variant}
        heading={<PostTitle variant={variant} effect={effect} kicker={kicker}>{title}</PostTitle>}
        time={
          <time data-slot="post-row-date" dateTime={dateTime} className="text-[13px] leading-5 text-muted-foreground tabular-nums">
            {label}
          </time>
        }
        tags={<PostTags tags={tags} />}
        excerpt={excerpt}
        extra={meta ? <span className="text-[13px] leading-5 text-muted-foreground">{meta}</span> : null}
      />
    </Root>
  )
}

export { PostRow, formatPostDate, type PostRowProps, type PostRowVariant, type PostRowEffect }
