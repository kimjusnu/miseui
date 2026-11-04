import { cn } from "@/registry/miseui/lib/utils"
import { GLASS_CLASS } from "@/registry/miseui/ui/floating-nav-views"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
} from "@/registry/miseui/ui/navigation-menu"
import { HeaderAction, HeaderBrand, HeaderDrawer, positionClass, type HeaderContent } from "./site-header-parts"

/** The positioner spans the whole row, so a panel shares the header's width and keeps its own margin from the edge. */
const PANEL_ROOM_CLASS = "[&_[data-slot=navigation-menu-positioner]]:px-2 @3xl:[&_[data-slot=navigation-menu-positioner]]:px-4"

function MegaMenus({ content }: { content: HeaderContent }) {
  const { menus, links, current, onSelect } = content
  return (
    <NavigationMenuList className="hidden flex-nowrap @3xl:flex">
      {menus.map((menu) => (
        <NavigationMenuItem key={menu.label} value={menu.label}>
          <NavigationMenuTrigger>{menu.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            {menu.groups.map((group) => (
              <NavigationMenuGroup key={group.title} title={group.title}>
                {group.links.map((link) => (
                  <NavigationMenuPanelLink key={link.href} href={link.href} title={link.label} description={link.description} active={current === link.href} onClick={() => onSelect(link.href)} />
                ))}
              </NavigationMenuGroup>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      ))}
      {links.map((link) => (
        <NavigationMenuItem key={link.href}>
          <NavigationMenuLink href={link.href} active={current === link.href} onClick={() => onSelect(link.href)}>
            {link.label}
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  )
}

/** For a product with more pages than a row can hold. The panels name where each link goes, so nobody has to open a page to find out. */
function HeaderMega({ content }: { content: HeaderContent }) {
  const { brandName, brandHref, primaryAction, secondaryAction, navLabel, position } = content
  return (
    <header data-slot="site-header-mega" className={cn("z-40 border-b", GLASS_CLASS, positionClass(position))}>
      <NavigationMenu variant="mega" effect="materialize" aria-label={navLabel} className={cn("mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 @3xl:gap-6 @3xl:px-6", PANEL_ROOM_CLASS)}>
        <HeaderBrand name={brandName} href={brandHref} />
        <MegaMenus content={content} />
        <div className="ms-auto flex items-center gap-2">
          {secondaryAction ? <HeaderAction action={secondaryAction} variant="ghost" className="hidden @3xl:inline-flex" /> : null}
          {primaryAction ? <HeaderAction action={primaryAction} variant="mise" /> : null}
          <HeaderDrawer content={content} className="-me-2 @3xl:hidden" />
        </div>
      </NavigationMenu>
    </header>
  )
}

export { HeaderMega }
