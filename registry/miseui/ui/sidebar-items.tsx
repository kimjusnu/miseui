import type * as React from "react"
import { createContext, useContext, useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronRight } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/registry/miseui/ui/dropdown-menu"
import { useSidebar } from "@/registry/miseui/ui/sidebar-state"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/miseui/ui/tooltip"
import { cn } from "@/registry/miseui/lib/utils"

/**
 * gap-3 starts the label exactly at the 40 px item's clip edge, so narrowing the column wipes the words
 * away and they stay in the accessibility tree, which an icon-only item would otherwise lose.
 */
const ITEM_CLASS = [
  "relative flex h-9 w-full items-center gap-3 overflow-hidden rounded-md px-3 text-start text-sm whitespace-nowrap text-foreground/80 outline-none pointer-coarse:h-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
  "data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-foreground",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  "[&_svg]:size-4 [&_svg]:shrink-0",
].join(" ")

const INSET_ACTIVE_CLASS = "data-[active=true]:bg-background data-[active=true]:shadow-xs"
const NESTED_ITEM_CLASS = "h-8"

interface ItemLevel {
  nested: boolean
  flyout: boolean
}

const ItemLevelContext = createContext<ItemLevel>({ nested: false, flyout: false })

interface LinkRenderProps {
  className: string
  children: React.ReactNode
  "aria-current"?: "page"
  "data-active"?: "true"
  "data-slot": string
  onClick?: React.MouseEventHandler<HTMLElement>
}

interface SidebarItemProps {
  icon?: React.ReactNode
  /** Marks the current page: `aria-current` and the tinted row. */
  active?: boolean
  /** A short count or word at the end of the row. Collapsed, it becomes a mark on the icon. */
  badge?: React.ReactNode
  href?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLElement>
  /** For a router's link: `render={(props) => <Link to="/inbox" {...props} />}`. */
  render?: (props: LinkRenderProps) => React.ReactElement
  className?: string
  children: React.ReactNode
}

function ItemBody({ icon, badge, icons, children }: Pick<SidebarItemProps, "icon" | "badge" | "children"> & { icons: boolean }) {
  return (
    <>
      {icon}
      <span className={icons ? "shrink-0" : "min-w-0 flex-1 truncate"}>{children}</span>
      {/* Without the comma, the accessible name runs together as "Inbox3". */}
      {badge !== undefined ? <span className="sr-only">, </span> : null}
      {badge !== undefined && !icons ? <span className="ms-auto shrink-0 ps-2 text-xs font-normal text-muted-foreground tabular-nums">{badge}</span> : null}
      {badge !== undefined && icons ? <span data-slot="sidebar-badge-mark" aria-hidden="true" className="absolute top-1.5 right-1.5 size-2 rounded-full bg-mise ring-2 ring-background" /> : null}
      {badge !== undefined && icons ? <span className="sr-only">{badge}</span> : null}
    </>
  )
}

function SidebarItem({ icon, active = false, badge, href, disabled = false, onClick, render, className, children }: SidebarItemProps) {
  const { icons, drawer, setDrawerOpen, variant } = useSidebar()
  const { nested, flyout } = useContext(ItemLevelContext)
  const props: LinkRenderProps = {
    className: cn(ITEM_CLASS, variant === "inset" && !flyout && INSET_ACTIVE_CLASS, nested && !flyout && NESTED_ITEM_CLASS, flyout && "h-auto rounded-sm px-2 py-1.5", className),
    children: <ItemBody icon={icon} badge={badge} icons={icons && !nested}>{children}</ItemBody>,
    "aria-current": active ? "page" : undefined,
    "data-active": active ? "true" : undefined,
    "data-slot": "sidebar-item",
    onClick: (event) => {
      onClick?.(event)
      if (drawer) setDrawerOpen(false)
    },
  }
  const element = disabled ? (
    <span {...props} aria-disabled="true" onClick={undefined} />
  ) : render ? (
    render(props)
  ) : href ? (
    <a {...props} href={href} />
  ) : (
    <button {...props} type="button" />
  )
  if (flyout) return <DropdownMenuItem asChild disabled={disabled} className="focus:bg-accent">{element}</DropdownMenuItem>
  if (!icons || nested) return <li>{element}</li>
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent side="right">
          {children}
          {badge !== undefined ? <span className="ms-2 tabular-nums opacity-70">{badge}</span> : null}
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

interface SidebarNestedProps {
  icon?: React.ReactNode
  label: string
  /** A page inside is the current one. */
  active?: boolean
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

/** An icon has no room for a nested list, so collapsed the children open beside it as a real menu. */
function NestedFlyout({ icon, label, active, className, children }: SidebarNestedProps) {
  return (
    <li>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button type="button" data-slot="sidebar-nested-trigger" data-active={active ? "true" : undefined} className={cn(ITEM_CLASS, className)}>
                {icon}
                <span className="shrink-0">{label}</span>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" aria-label={label}>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <ItemLevelContext.Provider value={{ nested: true, flyout: true }}>{children}</ItemLevelContext.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function NestedList({ id, open, spring, children }: { id: string; open: boolean; spring: boolean; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false
  const list = (
    <ul id={id} className="ms-5 mt-0.5 grid grid-cols-[minmax(0,1fr)] gap-0.5 border-s ps-2">
      <ItemLevelContext.Provider value={{ nested: true, flyout: false }}>{children}</ItemLevelContext.Provider>
    </ul>
  )
  if (!spring) return open ? list : null
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          className="overflow-hidden"
        >
          {list}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function SidebarNested(props: SidebarNestedProps) {
  const { icon, label, active = false, defaultOpen = false, className, children } = props
  const { icons, effect, variant } = useSidebar()
  const [open, setOpen] = useState(defaultOpen)
  const listId = useId()
  if (icons) return <NestedFlyout {...props} />
  return (
    <li>
      <button
        type="button"
        data-slot="sidebar-nested-trigger"
        data-active={active && !open ? "true" : undefined}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={cn(ITEM_CLASS, variant === "inset" && INSET_ACTIVE_CLASS, className)}
        onClick={() => setOpen(!open)}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronRight aria-hidden="true" className={cn("ms-auto text-muted-foreground transition-transform duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none", open && "rotate-90")} />
      </button>
      <NestedList id={listId} open={open} spring={effect === "spring"}>
        {children}
      </NestedList>
    </li>
  )
}

export { SidebarItem, SidebarNested, type LinkRenderProps, type SidebarItemProps, type SidebarNestedProps }
