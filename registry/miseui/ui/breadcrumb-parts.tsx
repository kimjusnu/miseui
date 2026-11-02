import type * as React from "react"
import { createContext, useContext } from "react"
import { motion } from "motion/react"
import { ChevronRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type BreadcrumbVariant = "chevron" | "slash" | "pill" | "back"
type BreadcrumbEffect = "spring"

interface BreadcrumbEntry {
  label: React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  icon?: React.ReactNode
}

interface BreadcrumbLinkProps {
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  className?: string
  children: React.ReactNode
  "data-slot"?: string
}

interface CollapsedTrail {
  before: readonly BreadcrumbEntry[]
  hidden: readonly BreadcrumbEntry[]
  after: readonly BreadcrumbEntry[]
}

/** Keeps the root and the nearest pages. A menu holding one page is worse than showing that page, so it needs two. */
function collapseItems(items: readonly BreadcrumbEntry[], maxItems: number): CollapsedTrail {
  const kept = Math.max(1, maxItems - 1)
  const hiddenCount = items.length - 1 - kept
  if (hiddenCount < 2) return { before: items, hidden: [], after: [] }
  return { before: items.slice(0, 1), hidden: items.slice(1, -kept), after: items.slice(-kept) }
}

const LINK_CLASS: Record<BreadcrumbVariant, string> = {
  chevron: "h-8 gap-1 rounded-sm px-1 text-sm text-muted-foreground hover:text-foreground pointer-coarse:h-10",
  slash: "h-8 gap-1 rounded-sm px-1 font-mono text-[13px] text-muted-foreground hover:text-foreground pointer-coarse:h-10",
  pill: "h-8 gap-1 rounded-full bg-muted px-3 text-[13px] text-foreground hover:bg-accent pointer-coarse:h-10",
  back: "group/back h-8 gap-1 rounded-sm pr-2 text-sm font-medium text-foreground pointer-coarse:h-10",
}

const CURRENT_CLASS: Record<Exclude<BreadcrumbVariant, "back">, string> = {
  chevron: "px-1 text-sm font-medium text-foreground",
  slash: "px-1 font-mono text-[13px] font-medium text-foreground",
  pill: "inline-flex h-8 items-center rounded-full bg-foreground px-3 text-[13px] font-medium text-background",
}

const LINK_BASE_CLASS = [
  "relative inline-flex min-w-0 items-center outline-none",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
]

const INSTANT = { duration: 0 } as const

interface BreadcrumbContextValue {
  variant: BreadcrumbVariant
  spring: boolean
  reduceMotion: boolean
  hovered: string | null
  setHovered: (key: string | null) => void
  renderLink?: (entry: BreadcrumbEntry, props: BreadcrumbLinkProps) => React.ReactNode
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  variant: "chevron",
  spring: false,
  reduceMotion: false,
  hovered: null,
  setHovered: () => undefined,
})

function useBreadcrumb() {
  return useContext(BreadcrumbContext)
}

/** The one highlight that slides between crumbs. Without the effect this is only a wrapper. */
function SpringTarget({ id, children }: { id: string; children: React.ReactNode }) {
  const { spring, reduceMotion, hovered, setHovered, variant } = useBreadcrumb()
  if (!spring) return <>{children}</>
  return (
    <span
      className="relative inline-flex min-w-0"
      onPointerEnter={() => setHovered(id)}
      onFocus={() => setHovered(id)}
      onBlur={() => setHovered(null)}
    >
      {hovered === id ? (
        <motion.span
          aria-hidden="true"
          data-slot="breadcrumb-highlight"
          layoutId="breadcrumb-highlight"
          // A pill's own fill would hide a highlight underneath it, so that one sits on top and lets clicks through.
          className={cn(
            "pointer-events-none absolute inset-0 bg-foreground/5",
            variant === "pill" ? "z-10 rounded-full" : "rounded-sm",
          )}
          transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
        />
      ) : null}
      {children}
    </span>
  )
}

function CrumbLink({
  entry,
  children,
  slot = "breadcrumb-link",
}: {
  entry: BreadcrumbEntry
  children?: React.ReactNode
  slot?: string
}) {
  const { variant, renderLink } = useBreadcrumb()
  const linkProps: BreadcrumbLinkProps = {
    href: entry.href,
    onClick: entry.onClick,
    className: cn(LINK_BASE_CLASS, LINK_CLASS[variant]),
    "data-slot": slot,
    children: children ?? (
      <>
        {entry.icon}
        {entry.label}
      </>
    ),
  }
  if (renderLink) return renderLink(entry, linkProps)
  if (entry.href === undefined && entry.onClick) {
    return <button type="button" {...linkProps} className={cn(linkProps.className, "cursor-pointer")} />
  }
  return <a {...linkProps} />
}

function CurrentCrumb({ entry }: { entry: BreadcrumbEntry }) {
  const { variant } = useBreadcrumb()
  return (
    <span
      aria-current="page"
      data-slot="breadcrumb-current"
      className={cn("inline-flex min-w-0 items-center gap-1", variant !== "back" && CURRENT_CLASS[variant])}
    >
      {entry.icon}
      {entry.label}
    </span>
  )
}

function CrumbSeparator() {
  const { variant } = useBreadcrumb()
  if (variant === "pill" || variant === "back") return null
  return (
    <span aria-hidden="true" data-slot="breadcrumb-separator" className="flex shrink-0 items-center text-muted-foreground/60">
      {variant === "slash" ? <span className="px-1 font-mono text-[13px]">/</span> : <ChevronRight className="size-4" />}
    </span>
  )
}

export {
  BreadcrumbContext,
  CrumbLink,
  CrumbSeparator,
  CurrentCrumb,
  SpringTarget,
  collapseItems,
  useBreadcrumb,
  LINK_BASE_CLASS,
  LINK_CLASS,
  type BreadcrumbEffect,
  type BreadcrumbEntry,
  type BreadcrumbLinkProps,
  type BreadcrumbVariant,
}
