import { cn } from "@/registry/miseui/lib/utils"
import { GLASS_CLASS } from "@/registry/miseui/ui/floating-nav-views"
import { HeaderAction, HeaderBrand, HeaderDrawer, positionClass, type HeaderContent } from "./site-header-parts"

const LINK_CLASS = "inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"

/** A plain row, for a site with a handful of pages. Every link stays one press away, and nothing opens over the page. */
function HeaderBar({ content }: { content: HeaderContent }) {
  const { brandName, brandHref, links, primaryAction, secondaryAction, current, onSelect, navLabel, position } = content
  return (
    <header data-slot="site-header-bar" className={cn("z-40 border-b", GLASS_CLASS, positionClass(position))}>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 @3xl:gap-6 @3xl:px-6">
        <HeaderBrand name={brandName} href={brandHref} />
        <nav aria-label={navLabel} className="hidden min-w-0 @3xl:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={current === link.href ? "page" : undefined}
                  onClick={() => onSelect(link.href)}
                  className={cn(LINK_CLASS, current === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {secondaryAction ? <HeaderAction action={secondaryAction} variant="ghost" className="hidden @3xl:inline-flex" /> : null}
          {primaryAction ? <HeaderAction action={primaryAction} variant="mise" /> : null}
          <HeaderDrawer content={content} className="-me-2 @3xl:hidden" />
        </div>
      </div>
    </header>
  )
}

export { HeaderBar }
