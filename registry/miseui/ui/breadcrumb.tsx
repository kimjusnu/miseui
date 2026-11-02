import type * as React from "react"
import { useId, useMemo, useState } from "react"
import { LayoutGroup, useReducedMotion } from "motion/react"
import { ChevronLeft, Ellipsis } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/miseui/ui/dropdown-menu"
import {
  BreadcrumbContext,
  CrumbLink,
  CrumbSeparator,
  CurrentCrumb,
  LINK_BASE_CLASS,
  LINK_CLASS,
  SpringTarget,
  collapseItems,
  useBreadcrumb,
  type BreadcrumbEffect,
  type BreadcrumbEntry,
  type BreadcrumbLinkProps,
  type BreadcrumbVariant,
} from "@/registry/miseui/ui/breadcrumb-parts"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_MAX_ITEMS = 4

type BreadcrumbProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** From the root to the current page. The last one is the page you are on and is never a link. */
  items: readonly BreadcrumbEntry[]
  /** `chevron` plain text and arrows, `slash` a monospace path, `pill` chips without separators, `back` only the parent. */
  variant?: BreadcrumbVariant
  /** `spring` slides one hover highlight between the crumbs. */
  effect?: BreadcrumbEffect
  /** How many pages stay visible before the middle collapses into a menu. */
  maxItems?: number
  /** Name of the nav landmark. */
  label?: string
  /** Name of the button that opens the collapsed pages. */
  moreLabel?: string
  /** Read before the parent's name in `back`. */
  backLabel?: string
  /** Renders each link with your router: `(entry, props) => <Link to={entry.href} {...props} />`. */
  renderLink?: (entry: BreadcrumbEntry, props: BreadcrumbLinkProps) => React.ReactNode
}

function MoreMenu({ hidden, label }: { hidden: readonly BreadcrumbEntry[]; label: string }) {
  const { variant, renderLink } = useBreadcrumb()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        data-slot="breadcrumb-more"
        className={cn(
          LINK_BASE_CLASS,
          LINK_CLASS[variant],
          "min-w-8 justify-center data-[state=open]:text-foreground pointer-coarse:min-w-10",
        )}
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {hidden.map((entry, index) => (
          <DropdownMenuItem key={index} asChild={entry.href !== undefined} onClick={entry.onClick}>
            {entry.href === undefined ? (
              entry.label
            ) : renderLink ? (
              renderLink(entry, { href: entry.href, children: entry.label })
            ) : (
              <a href={entry.href}>{entry.label}</a>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Trail({ items, maxItems, moreLabel }: { items: readonly BreadcrumbEntry[]; maxItems: number; moreLabel: string }) {
  const { setHovered, spring } = useBreadcrumb()
  const { before, hidden, after } = collapseItems(items, maxItems)
  const last = items[items.length - 1]
  const crumb = (entry: BreadcrumbEntry, id: string) => (
    <li key={id} className="inline-flex min-w-0 items-center gap-1">
      {entry === last ? (
        <CurrentCrumb entry={entry} />
      ) : (
        <>
          <SpringTarget id={id}>
            <CrumbLink entry={entry} />
          </SpringTarget>
          <CrumbSeparator />
        </>
      )}
    </li>
  )
  return (
    <ol
      className="flex min-w-0 flex-wrap items-center gap-x-1"
      onPointerLeave={spring ? () => setHovered(null) : undefined}
    >
      {before.map((entry, index) => crumb(entry, `before-${index}`))}
      {hidden.length > 0 ? (
        <li className="inline-flex items-center gap-1">
          <SpringTarget id="more">
            <MoreMenu hidden={hidden} label={moreLabel} />
          </SpringTarget>
          <CrumbSeparator />
        </li>
      ) : null}
      {after.map((entry, index) => crumb(entry, `after-${index}`))}
    </ol>
  )
}

function BackLink({ parent, backLabel }: { parent: BreadcrumbEntry; backLabel: string }) {
  return (
    <SpringTarget id="back">
      <CrumbLink entry={parent}>
        <ChevronLeft
          aria-hidden="true"
          className="transition-transform duration-(--duration-fast) ease-(--ease-mise) group-hover/back:-translate-x-1 motion-reduce:transition-none"
        />
        <span className="sr-only">{backLabel}</span> {parent.label}
      </CrumbLink>
    </SpringTarget>
  )
}

function Breadcrumb({
  items,
  variant = "chevron",
  effect,
  maxItems = DEFAULT_MAX_ITEMS,
  label = "Breadcrumb",
  moreLabel = "Show hidden pages",
  backLabel = "Back to",
  renderLink,
  className,
  ...props
}: BreadcrumbProps) {
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [hovered, setHovered] = useState<string | null>(null)
  const spring = effect === "spring"
  const context = useMemo(
    () => ({ variant, spring, reduceMotion, hovered, setHovered, renderLink }),
    [variant, spring, reduceMotion, hovered, renderLink],
  )
  const parent = items[items.length - 2]
  if (items.length === 0 || (variant === "back" && !parent)) return null
  return (
    <BreadcrumbContext.Provider value={context}>
      {/* layoutId is global to the page; without a per-instance group two trails would share one highlight. */}
      <LayoutGroup id={groupId}>
        <nav
          aria-label={label}
          data-slot="breadcrumb"
          data-variant={variant}
          data-effect={effect}
          className={cn("min-w-0", className)}
          {...props}
        >
          {variant === "back" ? (
            <BackLink parent={parent} backLabel={backLabel} />
          ) : (
            <Trail items={items} maxItems={maxItems} moreLabel={moreLabel} />
          )}
        </nav>
      </LayoutGroup>
    </BreadcrumbContext.Provider>
  )
}

export {
  Breadcrumb,
  collapseItems,
  type BreadcrumbProps,
  type BreadcrumbEntry,
  type BreadcrumbLinkProps,
  type BreadcrumbVariant,
  type BreadcrumbEffect,
}
