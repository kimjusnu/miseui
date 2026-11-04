import { cn } from "@/registry/miseui/lib/utils"
import { FloatingNav } from "@/registry/miseui/ui/floating-nav"
import { GLASS_CLASS } from "@/registry/miseui/ui/floating-nav-views"
import { HeaderAction, HeaderBrand, HeaderDrawer, positionClass, type HeaderContent } from "./site-header-parts"

const CHIP_CLASS = "pointer-events-auto rounded-full shadow-md ring-1 shadow-black/5 ring-foreground/10 dark:shadow-black/40"

/**
 * Pieces on the page instead of a bar across it, for a site whose first screen is a picture worth keeping whole.
 * The row has no height of its own, so the page runs under it, and it sticks inside the block rather than the window.
 * The accent is the active link's highlight, so the action stays in ink.
 */
function HeaderFloating({ content }: { content: HeaderContent }) {
  const { brandName, brandHref, links, primaryAction, secondaryAction, current, onSelect, navLabel, position } = content
  const items = links.map((link) => ({ value: link.href, label: link.label, href: link.href }))
  return (
    <header data-slot="site-header-floating" className={cn("pointer-events-none z-40 h-0", positionClass(position))}>
      <div className="relative mx-auto flex max-w-6xl items-start justify-between gap-2 px-3 pt-3 @3xl:px-4">
        <HeaderBrand name={brandName} href={brandHref} className={cn("px-4 pointer-coarse:min-h-12", CHIP_CLASS, GLASS_CLASS)} />
        {/* Above any page, in the middle of the row. On a phone the drawer takes over, so the pill does not have to scroll. */}
        <FloatingNav label={navLabel} variant="pill" position="absolute" items={items} value={current ?? ""} onValueChange={onSelect} className="top-3 hidden @3xl:flex" />
        <div className={cn("flex items-center gap-1 p-1 @3xl:gap-2", CHIP_CLASS, GLASS_CLASS)}>
          {secondaryAction ? <HeaderAction action={secondaryAction} variant="ghost" className="hidden h-8 rounded-full @5xl:inline-flex" /> : null}
          {primaryAction ? <HeaderAction action={primaryAction} variant="default" className="h-8 rounded-full" /> : null}
          <HeaderDrawer content={content} className="-my-1 rounded-full @3xl:hidden" />
        </div>
      </div>
    </header>
  )
}

export { HeaderFloating }
