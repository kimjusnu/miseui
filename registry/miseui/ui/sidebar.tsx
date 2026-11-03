import type * as React from "react"
import { useContext, useId } from "react"
import { motion, useReducedMotion } from "motion/react"
import { PanelLeft } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { Drawer, DrawerContent, DrawerTitle } from "@/registry/miseui/ui/drawer"
import { SidebarItem, SidebarNested, type LinkRenderProps, type SidebarItemProps, type SidebarNestedProps } from "@/registry/miseui/ui/sidebar-items"
import {
  SidebarContext,
  SidebarProvider,
  isToggleShortcut,
  useSidebar,
  type SidebarEffect,
  type SidebarProviderProps,
  type SidebarVariant,
} from "@/registry/miseui/ui/sidebar-state"
import { cn } from "@/registry/miseui/lib/utils"

const DEFAULT_WIDTH = 240
/** 40 px items plus 8 px padding each side. */
const ICON_WIDTH = 56
const DRAWER_WIDTH_CLASS = "w-[min(18rem,calc(100vw-3rem))]"

const SURFACE_CLASS: Record<SidebarVariant, string> = {
  plain: "h-full border-e bg-background",
  floating: "m-2 h-[calc(100%-1rem)] rounded-xl border bg-background shadow-sm dark:shadow-black/40",
  inset: "h-full bg-muted",
  rail: "h-full border-e bg-background",
}

type AsideAttributes = Omit<React.ComponentProps<"aside">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">

interface SidebarProps extends AsideAttributes, Omit<SidebarProviderProps, "children"> {
  /** Names the navigation landmark and the drawer. */
  label?: string
  /** Open width in px. */
  width?: number
}

function SidebarSurface({ label = "Main", width = DEFAULT_WIDTH, className, style, children, ...props }: AsideAttributes & { label?: string; width?: number }) {
  const { variant, effect, icons, drawer, drawerOpen, setDrawerOpen } = useSidebar()
  const reduceMotion = useReducedMotion() ?? false
  if (drawer) {
    return (
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} side="left">
        <DrawerContent aria-describedby={undefined} className={DRAWER_WIDTH_CLASS} data-testid="sidebar-drawer">
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          <div data-slot="sidebar" data-variant={variant} data-drawer="true" aria-label={label} className={cn("flex min-h-0 flex-1 flex-col pt-12 has-[[data-slot=sidebar-header]]:pt-0", className)}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
  const size = icons ? ICON_WIDTH : width
  const shared = {
    "data-slot": "sidebar",
    "data-variant": variant,
    "data-effect": effect,
    "data-collapsed": icons ? "true" : undefined,
    "aria-label": label,
    className: cn("flex max-w-full shrink-0 flex-col overflow-hidden", SURFACE_CLASS[variant], className),
  }
  if (effect === "spring") {
    return (
      <motion.aside {...shared} {...props} style={style} initial={false} animate={{ width: size }} transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}>
        {children}
      </motion.aside>
    )
  }
  return (
    <aside {...shared} {...props} style={{ ...style, width: size }}>
      {children}
    </aside>
  )
}

/** Brings its own provider unless one is already there. Inside a provider, set `variant` and friends on the provider. */
function Sidebar({ variant, effect, collapsed, defaultCollapsed, onCollapsedChange, shortcut, mobile, ...props }: SidebarProps) {
  const outer = useContext(SidebarContext)
  if (outer) return <SidebarSurface {...props} />
  return (
    <SidebarProvider variant={variant} effect={effect} collapsed={collapsed} defaultCollapsed={defaultCollapsed} onCollapsedChange={onCollapsedChange} shortcut={shortcut} mobile={mobile}>
      <SidebarSurface {...props} />
    </SidebarProvider>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex h-14 shrink-0 items-center gap-3 overflow-hidden px-3 whitespace-nowrap", className)} {...props} />
}

function SidebarContent({ className, label = "Primary", ...props }: React.ComponentProps<"nav"> & { label?: string }) {
  return <nav data-slot="sidebar-content" aria-label={label} className={cn("grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-4 overflow-x-hidden overflow-y-auto p-2", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("mt-auto shrink-0 border-t p-2", className)} {...props} />
}

function SidebarGroup({ label, className, children, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  const { icons } = useSidebar()
  const labelId = useId()
  return (
    <div data-slot="sidebar-group" role="group" aria-labelledby={label ? labelId : undefined} className={cn("grid grid-cols-[minmax(0,1fr)] gap-0.5", className)} {...props}>
      {label ? (
        <p id={labelId} className={icons ? "sr-only" : "flex h-8 items-center truncate px-3 text-[13px] text-muted-foreground"}>
          {label}
        </p>
      ) : null}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">{children}</ul>
    </div>
  )
}

function SidebarTrigger({ className, children, "aria-label": ariaLabel = "Toggle sidebar", onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggle, expanded, canToggle, shortcut } = useSidebar()
  if (!canToggle) return null
  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      aria-keyshortcuts={shortcut ? "Meta+B Control+B" : undefined}
      className={cn("shrink-0 pointer-coarse:size-10", className)}
      onClick={(event) => {
        onClick?.(event)
        toggle()
      }}
      {...props}
    >
      {children ?? <PanelLeft aria-hidden="true" />}
    </Button>
  )
}

/** The page beside an `inset` sidebar: raised on its own surface while the sidebar's tint runs around it. */
function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("my-2 me-2 min-w-0 flex-1 overflow-auto rounded-xl border bg-background max-md:m-0 max-md:rounded-none max-md:border-0", className)} {...props} />
}

export {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarNested,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
  isToggleShortcut,
  type LinkRenderProps,
  type SidebarEffect,
  type SidebarItemProps,
  type SidebarNestedProps,
  type SidebarProps,
  type SidebarProviderProps,
  type SidebarVariant,
}
