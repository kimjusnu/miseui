import type * as React from "react"
import { createContext, useContext, useLayoutEffect, useRef, useState } from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import {
  CONTENT_LAYOUT_CLASS,
  CONTENT_MATERIALIZE_CLASS,
  CONTENT_WIDTH_CLASS,
  INDICATOR_BASE_CLASS,
  INDICATOR_CLASS,
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  LIST_CLASS,
  PANEL_ENTER_CLASS,
  PANEL_MATERIALIZE_CLASS,
  VIEWPORT_LEFT,
  type NavigationMenuEffect,
  type NavigationMenuVariant,
} from "@/registry/miseui/ui/navigation-menu-classes"
import { NavigationMenuGroup, NavigationMenuPanelLink } from "@/registry/miseui/ui/navigation-menu-parts"
import { cn } from "@/registry/miseui/lib/utils"

const HOVER_DELAY_MS = 120

interface NavigationMenuContextValue {
  variant: NavigationMenuVariant
  effect?: NavigationMenuEffect
}

const NavigationMenuContext = createContext<NavigationMenuContextValue>({ variant: "bar" })

type NavigationMenuProps = React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  /** `bar` plain links, `mega` a full-width panel of groups, `pill` a sliding pill, `underline` a sliding rule. */
  variant?: NavigationMenuVariant
  /** `materialize` grows the panel out of the bar and morphs its size and place between triggers. */
  effect?: NavigationMenuEffect
}

/** Keeps the panel under its trigger. Written to the DOM: nothing else in the render depends on it. */
function useTriggerLeft(rootRef: React.RefObject<HTMLElement | null>, open: string, follow: boolean) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !open || !follow) return
    const trigger = root.querySelector("[data-slot='navigation-menu-trigger'][data-state='open']")
    if (!trigger) return
    const left = trigger.getBoundingClientRect().left - root.getBoundingClientRect().left
    root.style.setProperty("--navigation-menu-left", `${left}px`)
  }, [rootRef, open, follow])
}

function NavigationMenu({
  variant = "bar",
  effect,
  value,
  defaultValue,
  onValueChange,
  delayDuration = HOVER_DELAY_MS,
  className,
  children,
  ...props
}: NavigationMenuProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "")
  const open = value ?? uncontrolled
  const context = { variant, effect }
  useTriggerLeft(rootRef, open, variant !== "mega")
  return (
    <NavigationMenuContext.Provider value={context}>
      <NavigationMenuPrimitive.Root
        ref={rootRef}
        data-slot="navigation-menu"
        data-variant={variant}
        data-effect={effect}
        value={open}
        delayDuration={delayDuration}
        onValueChange={(next) => {
          setUncontrolled(next)
          onValueChange?.(next)
        }}
        // The root is the container for the panel widths. Containment needs a width of its own, hence w-full.
        className={cn("@container relative w-full min-w-0", className)}
        {...props}
      >
        {children}
        <NavigationMenuPanel variant={variant} effect={effect} />
      </NavigationMenuPrimitive.Root>
    </NavigationMenuContext.Provider>
  )
}

function NavigationMenuPanel({ variant, effect }: NavigationMenuContextValue) {
  const mega = variant === "mega"
  return (
    <div data-slot="navigation-menu-positioner" className="pointer-events-none absolute top-full left-0 z-40 w-full pt-2">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        style={mega ? undefined : { left: VIEWPORT_LEFT }}
        className={cn(
          "pointer-events-auto relative h-(--radix-navigation-menu-viewport-height) max-w-full origin-top overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg",
          mega ? "w-full" : "w-(--radix-navigation-menu-viewport-width)",
          effect === "materialize" ? PANEL_MATERIALIZE_CLASS : PANEL_ENTER_CLASS,
        )}
      />
    </div>
  )
}

function NavigationMenuList({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  const { variant } = useContext(NavigationMenuContext)
  const indicator = INDICATOR_CLASS[variant]
  return (
    <NavigationMenuPrimitive.List data-slot="navigation-menu-list" className={cn(LIST_CLASS[variant], className)} {...props}>
      {children}
      {indicator ? (
        <NavigationMenuPrimitive.Indicator data-slot="navigation-menu-indicator" className={cn(INDICATOR_BASE_CLASS, indicator)} />
      ) : null}
    </NavigationMenuPrimitive.List>
  )
}

function NavigationMenuItem(props: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
}

function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const { variant } = useContext(NavigationMenuContext)
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], "disabled:pointer-events-none disabled:opacity-50", className)}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className="size-3 text-muted-foreground transition-transform duration-(--duration-fast) ease-(--ease-mise) group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  const { variant, effect } = useContext(NavigationMenuContext)
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "absolute top-0 left-0",
        CONTENT_WIDTH_CLASS[variant],
        CONTENT_LAYOUT_CLASS[variant],
        effect === "materialize" && CONTENT_MATERIALIZE_CLASS,
        className,
      )}
      {...props}
    />
  )
}

/** A top-level link in the bar, with no panel. Set `active` on the current page. */
function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  const { variant } = useContext(NavigationMenuContext)
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], className)}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
  type NavigationMenuEffect,
  type NavigationMenuProps,
  type NavigationMenuVariant,
}
