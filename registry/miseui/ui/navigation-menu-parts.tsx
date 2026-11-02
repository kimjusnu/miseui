import type * as React from "react"
import { useId } from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"
import { PANEL_LINK_CLASS } from "@/registry/miseui/ui/navigation-menu-classes"
import { cn } from "@/registry/miseui/lib/utils"

type NavigationMenuPanelLinkProps = Omit<React.ComponentProps<typeof NavigationMenuPrimitive.Link>, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
}

/** A row inside a panel, with room for one line saying where it goes. */
function NavigationMenuPanelLink({ title, description, icon, className, ...props }: NavigationMenuPanelLinkProps) {
  return (
    <NavigationMenuPrimitive.Link data-slot="navigation-menu-panel-link" className={cn(PANEL_LINK_CLASS, className)} {...props}>
      {icon ? <span aria-hidden="true" className="flex h-5 shrink-0 items-center text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {description ? <span className="block text-[13px] text-muted-foreground">{description}</span> : null}
      </span>
    </NavigationMenuPrimitive.Link>
  )
}

interface NavigationMenuGroupProps extends React.ComponentProps<"div"> {
  title: string
}

/** One titled column of a `mega` panel. */
function NavigationMenuGroup({ title, className, children, ...props }: NavigationMenuGroupProps) {
  const titleId = useId()
  return (
    <div role="group" aria-labelledby={titleId} data-slot="navigation-menu-group" className={cn("grid content-start gap-1", className)} {...props}>
      <p id={titleId} className="px-2 pb-1 text-[13px] text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

export { NavigationMenuGroup, NavigationMenuPanelLink, type NavigationMenuPanelLinkProps }
