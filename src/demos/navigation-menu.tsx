import { BarChart3, BookOpen, FileText, LifeBuoy, Mail, Newspaper, Users, Workflow } from "lucide-react"
import type * as React from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
  type NavigationMenuProps,
} from "@/registry/miseui/ui/navigation-menu"

/** Links in a demo must not jump the page to the top. */
const stay = (event: React.MouseEvent) => event.preventDefault()

function Link(props: React.ComponentProps<typeof NavigationMenuPanelLink>) {
  return <NavigationMenuPanelLink href="#" onClick={stay} {...props} />
}

function ShortMenu({ label, ...props }: NavigationMenuProps & { label: string }) {
  return (
    <NavigationMenu aria-label={label} {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <Link title="Reports" description="Numbers your team reads weekly" icon={<BarChart3 />} />
            <Link title="Workflows" description="Hand work on without chasing" icon={<Workflow />} />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="docs">
          <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
          <NavigationMenuContent>
            <Link title="Guides" description="Start here" icon={<BookOpen />} />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" onClick={stay} active>Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MegaMenu() {
  return (
    <NavigationMenu aria-label="Marketing site" variant="mega" effect="materialize">
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuGroup title="Measure">
              <Link title="Reports" description="Numbers your team reads weekly" icon={<BarChart3 />} />
              <Link title="Exports" description="CSV, on a schedule" icon={<FileText />} />
            </NavigationMenuGroup>
            <NavigationMenuGroup title="Automate">
              <Link title="Workflows" description="Hand work on without chasing" icon={<Workflow />} />
              <Link title="Email rules" description="Sort replies as they arrive" icon={<Mail />} />
            </NavigationMenuGroup>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="company">
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuGroup title="About">
              <Link title="Team" description="Who works here" icon={<Users />} />
              <Link title="News" description="What changed this year" icon={<Newspaper />} />
            </NavigationMenuGroup>
            <NavigationMenuGroup title="Help">
              <Link title="Support" description="Answers within a day" icon={<LifeBuoy />} />
            </NavigationMenuGroup>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">bar, materialize effect: sweep across the triggers</p>
        <ShortMenu label="App" effect="materialize" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">pill</p>
        <ShortMenu label="Product" variant="pill" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">underline</p>
        <ShortMenu label="Section" variant="underline" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">mega, materialize effect</p>
        <MegaMenu />
      </div>
    </div>
  )
}
