import type * as React from "react"
import { useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/registry/miseui/ui/drawer"
import type { SiteHeaderAction, SiteHeaderLink, SiteHeaderMenu } from "./site-header-sample"

/** Sticks or stays fixed inside the block by default, so a frame around it contains the header. */
type SiteHeaderPosition = "sticky" | "fixed"

interface HeaderContent {
  brandName: React.ReactNode
  brandHref: string
  links: readonly SiteHeaderLink[]
  menus: readonly SiteHeaderMenu[]
  primaryAction: SiteHeaderAction | null
  secondaryAction: SiteHeaderAction | null
  current: string | undefined
  onSelect: (href: string) => void
  navLabel: string
  position: SiteHeaderPosition
}

function HeaderBrand({ name, href, className }: { name: React.ReactNode; href: string; className?: string }) {
  return (
    <a href={href} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-md text-[15px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}>
      {name}
    </a>
  )
}

function HeaderAction({ action, variant, className }: { action: SiteHeaderAction; variant: React.ComponentProps<typeof Button>["variant"]; className?: string }) {
  return (
    <Button asChild variant={variant} className={cn("pointer-coarse:h-10", className)}>
      <a href={action.href}>{action.label}</a>
    </Button>
  )
}

const DRAWER_LINK_CLASS = "flex min-h-11 items-center rounded-md px-3 text-[15px] outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset aria-[current=page]:bg-accent aria-[current=page]:font-medium"

function DrawerLink({ link, current, onPress }: { link: SiteHeaderLink; current: string | undefined; onPress: (href: string) => void }) {
  return (
    <li>
      <a href={link.href} aria-current={current === link.href ? "page" : undefined} onClick={() => onPress(link.href)} className={DRAWER_LINK_CLASS}>
        {link.label}
      </a>
    </li>
  )
}

/** Everything the header hides on a phone, all open at once: tapping through folds to find one link costs more than a short scroll. */
function HeaderDrawer({ content, className }: { content: HeaderContent; className?: string }) {
  const [open, setOpen] = useState(false)
  const { brandName, links, menus, primaryAction, secondaryAction, current, onSelect, navLabel } = content
  const press = (href: string) => {
    onSelect(href)
    setOpen(false)
  }
  return (
    <Drawer open={open} onOpenChange={setOpen} side="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className={cn("size-10", className)}>
          <Menu aria-hidden="true" />
        </Button>
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle>{brandName}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <nav aria-label={navLabel} className="flex flex-col gap-4">
            {menus.flatMap((menu) => menu.groups).map((group) => (
              <div key={group.title} className="flex flex-col gap-1">
                <p className="px-3 text-[13px] text-muted-foreground">{group.title}</p>
                <ul>
                  {group.links.map((link) => (
                    <DrawerLink key={link.href} link={link} current={current} onPress={press} />
                  ))}
                </ul>
              </div>
            ))}
            {links.length > 0 ? (
              <ul>
                {links.map((link) => (
                  <DrawerLink key={link.href} link={link} current={current} onPress={press} />
                ))}
              </ul>
            ) : null}
          </nav>
        </DrawerBody>
        {primaryAction || secondaryAction ? (
          <DrawerFooter className="flex-col sm:flex-col">
            {primaryAction ? <HeaderAction action={primaryAction} variant="mise" className="w-full" /> : null}
            {secondaryAction ? <HeaderAction action={secondaryAction} variant="outline" className="w-full" /> : null}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

/** A hash link would fight a hash router, and Safari does not move focus for it anyway. */
function SkipLink({ targetId, label }: { targetId: string; label: string }) {
  return (
    <a
      data-slot="site-header-skip"
      href={`#${targetId}`}
      onClick={(event) => {
        event.preventDefault()
        const target = document.getElementById(targetId)
        if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
        target?.focus()
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:rounded-md focus:bg-background focus:px-3 focus:text-sm focus:shadow-md focus:ring-[3px] focus:ring-ring/50 focus:outline-none"
    >
      {label}
    </a>
  )
}

function positionClass(position: SiteHeaderPosition) {
  return position === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0"
}

export { HeaderAction, HeaderBrand, HeaderDrawer, positionClass, SkipLink, type HeaderContent, type SiteHeaderPosition }
