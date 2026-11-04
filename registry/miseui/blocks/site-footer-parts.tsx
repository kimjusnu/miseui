import type * as React from "react"
import { useId } from "react"
import { cn } from "@/registry/miseui/lib/utils"

interface SiteFooterLink {
  label: string
  href: string
}

interface SiteFooterColumn {
  title: string
  links: readonly SiteFooterLink[]
}

interface SiteFooterSharedProps extends React.ComponentProps<"footer"> {
  /** Your product name, used in the copyright line and beside the tagline on `columns`. */
  brand?: string
  /** Replaces the line built from the current year and `brand`. */
  copyright?: string
}

const DEFAULT_BRAND = "Paperline"

const DEFAULT_COLUMNS: readonly SiteFooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Summaries", href: "#summaries" },
      { label: "Action items", href: "#action-items" },
      { label: "Integrations", href: "#integrations" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides", href: "#guides" },
      { label: "Changelog", href: "#changelog" },
      { label: "Status", href: "#status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
  },
]

const DEFAULT_LEGAL: readonly SiteFooterLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
]

const ROOT_CLASS = "@container flex w-full flex-col justify-center"
const INNER_CLASS = "mx-auto w-full max-w-6xl px-4 @2xl:px-8"

/**
 * A 20 px line plus 10 px above and below makes the 40 px touch target, without moving a single word on a desktop.
 * The stacks and rows below open their gaps by the same amount on touch, so two targets never overlap.
 */
const LINK_CLASS =
  "relative inline-block rounded-sm text-sm leading-5 text-muted-foreground outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2.5"

function FooterLinkRow({ links, label, className }: { links: readonly SiteFooterLink[]; label: string; className?: string }) {
  if (links.length === 0) return null
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 pointer-coarse:gap-y-5">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className={LINK_CLASS}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function FooterColumn({ column }: { column: SiteFooterColumn }) {
  const titleId = useId()
  return (
    <div className="flex min-w-0 flex-col gap-3 pointer-coarse:gap-5">
      <p id={titleId} className="text-[13px] leading-5 font-medium">
        {column.title}
      </p>
      <ul aria-labelledby={titleId} className="flex flex-col items-start gap-2 pointer-coarse:gap-5">
        {column.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className={LINK_CLASS}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterColumns({ columns, className }: { columns: readonly SiteFooterColumn[]; className?: string }) {
  if (columns.length === 0) return null
  return (
    <nav aria-label="Footer" data-slot="site-footer-columns" className={cn("grid grid-cols-2 gap-x-6 gap-y-8 @lg:grid-cols-3", className)}>
      {columns.map((column) => (
        <FooterColumn key={column.title} column={column} />
      ))}
    </nav>
  )
}

/** Reads the clock so a copied footer never ships last year. The server and a browser can disagree for a moment at New Year, which is harmless. */
function CopyrightLine({ brand, copyright }: { brand: string; copyright?: string }) {
  return (
    <p className="text-[13px] leading-5 text-muted-foreground" suppressHydrationWarning>
      {copyright ?? `© ${new Date().getFullYear()} ${brand}`}
    </p>
  )
}

function LegalRow({ brand, copyright, legal }: { brand: string; copyright?: string; legal: readonly SiteFooterLink[] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-6">
      <CopyrightLine brand={brand} copyright={copyright} />
      <FooterLinkRow links={legal} label="Legal" />
    </div>
  )
}

export {
  CopyrightLine,
  DEFAULT_BRAND,
  DEFAULT_COLUMNS,
  DEFAULT_LEGAL,
  FooterColumns,
  FooterLinkRow,
  INNER_CLASS,
  LegalRow,
  ROOT_CLASS,
  type SiteFooterColumn,
  type SiteFooterLink,
  type SiteFooterSharedProps,
}
