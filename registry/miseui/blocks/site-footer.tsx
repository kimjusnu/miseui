import { cn } from "@/registry/miseui/lib/utils"
import {
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
} from "./site-footer-parts"
import { SiteFooterSignup, type SiteFooterSignupOptions } from "./site-footer-signup"

type SiteFooterVariant = "columns" | "minimal" | "signup"

const DEFAULT_LINKS: readonly SiteFooterLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Status", href: "#status" },
  { label: "Contact", href: "#contact" },
]

interface SiteFooterProps extends SiteFooterSharedProps, SiteFooterSignupOptions {
  /** `columns` a full map of the site, `minimal` one line for an app or a short site, `signup` a newsletter field above the links. Anything else is `columns`. */
  variant?: SiteFooterVariant
  /** One sentence beside the links on `columns`. */
  tagline?: string
  /** The link groups on `columns` and `signup`. An empty list leaves only the legal line. */
  columns?: readonly SiteFooterColumn[]
  /** The small links beside the copyright on `columns` and `signup`. */
  legal?: readonly SiteFooterLink[]
  /** The whole list on `minimal`. */
  links?: readonly SiteFooterLink[]
}

function SiteFooterColumns({
  brand = DEFAULT_BRAND,
  tagline = "Calls that end in a plan, written before you leave.",
  columns = DEFAULT_COLUMNS,
  legal = DEFAULT_LEGAL,
  copyright,
  className,
  ...props
}: Omit<SiteFooterProps, "variant" | "links" | keyof SiteFooterSignupOptions>) {
  return (
    <footer data-slot="site-footer" data-variant="columns" className={cn(ROOT_CLASS, "border-t bg-muted dark:bg-background", className)} {...props}>
      <div className={cn(INNER_CLASS, "flex flex-col gap-12 py-12")}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-12">
          <div className="flex max-w-xs flex-col gap-2">
            <p className="text-title text-lg">{brand}</p>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p>
          </div>
          <FooterColumns columns={columns} />
        </div>
        <LegalRow brand={brand} copyright={copyright} legal={legal} />
      </div>
    </footer>
  )
}

function SiteFooterMinimal({
  brand = DEFAULT_BRAND,
  links = DEFAULT_LINKS,
  copyright,
  className,
  ...props
}: Omit<SiteFooterProps, "variant" | "tagline" | "columns" | "legal" | keyof SiteFooterSignupOptions>) {
  return (
    <footer data-slot="site-footer" data-variant="minimal" className={cn(ROOT_CLASS, "border-t bg-background", className)} {...props}>
      <div className={cn(INNER_CLASS, "flex flex-col gap-3 py-6 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-6")}>
        <CopyrightLine brand={brand} copyright={copyright} />
        <FooterLinkRow links={links} label="Footer" />
      </div>
    </footer>
  )
}

function SiteFooter({ variant, tagline, columns, legal, links, onSubscribe, signupTitle, signupQuiet, signupNote, doneMessage, ...props }: SiteFooterProps) {
  switch (variant) {
    case "minimal":
      return <SiteFooterMinimal links={links} {...props} />
    case "signup":
      return (
        <SiteFooterSignup
          columns={columns}
          legal={legal}
          onSubscribe={onSubscribe}
          signupTitle={signupTitle}
          signupQuiet={signupQuiet}
          signupNote={signupNote}
          doneMessage={doneMessage}
          {...props}
        />
      )
    default:
      return <SiteFooterColumns tagline={tagline} columns={columns} legal={legal} {...props} />
  }
}

export { SiteFooter, type SiteFooterColumn, type SiteFooterLink, type SiteFooterProps, type SiteFooterVariant }
