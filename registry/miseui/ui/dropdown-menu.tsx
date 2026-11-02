import type * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"
import {
  MENU_MATERIALIZE_CLASS,
  MENU_SPRING_CONTENT_CLASS,
  MENU_SPRING_ITEM_CLASS,
  MenuHighlight,
  MenuSpringScope,
  useMenuItemHighlight,
  type DropdownMenuEffect,
} from "@/registry/miseui/ui/dropdown-menu-effects"

/** Gap between the trigger and the menu, in px. */
const SIDE_OFFSET_PX = 4

const PLAIN_MOTION_CLASS = [
  "duration-(--duration-fast) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
  "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
]

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

type DropdownMenuContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  /** `materialize` grows the menu out of the trigger; `spring` slides one highlight between the items. */
  effect?: DropdownMenuEffect
}

function DropdownMenuContent({ className, sideOffset = SIDE_OFFSET_PX, effect, ...props }: DropdownMenuContentProps) {
  return (
    <MenuSpringScope enabled={effect === "spring"}>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          data-effect={effect}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-32 overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
            "max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin)",
            effect === "materialize" ? MENU_MATERIALIZE_CLASS : PLAIN_MOTION_CLASS,
            effect === "spring" && MENU_SPRING_CONTENT_CLASS,
            className,
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Portal>
    </MenuSpringScope>
  )
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  /** Destructive items read in the destructive colour so the eye slows down before clicking. */
  variant?: "default" | "destructive"
}

function DropdownMenuItem({
  className,
  variant = "default",
  asChild,
  children,
  onFocus,
  onBlur,
  ...props
}: DropdownMenuItemProps) {
  const highlight = useMenuItemHighlight({ asChild, onFocus, onBlur })
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      asChild={asChild}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
        "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise)",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive",
        "dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:*:[svg]:text-destructive!",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        highlight.spring && MENU_SPRING_ITEM_CLASS,
        className,
      )}
      onFocus={highlight.onFocus}
      onBlur={highlight.onBlur}
      {...props}
    >
      {highlight.spring ? (
        <>
          {highlight.highlighted ? <MenuHighlight variant={variant} reduceMotion={highlight.reduceMotion} /> : null}
          {children}
        </>
      ) : (
        children
      )}
    </DropdownMenuPrimitive.Item>
  )
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1.5 text-sm font-medium", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  type DropdownMenuItemProps,
  type DropdownMenuContentProps,
  type DropdownMenuEffect,
}
