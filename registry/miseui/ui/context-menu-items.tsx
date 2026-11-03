import type * as React from "react"
import { createContext, useContext } from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"
import { Check, ChevronRight, Circle } from "lucide-react"
import {
  DESTRUCTIVE_ITEM_CLASS,
  GROUP_CLASS,
  INDICATOR_ITEM_CLASS,
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  LABEL_CLASS,
  QUICK_ITEM_CLASS,
  type ContextMenuEffect,
  type ContextMenuVariant,
} from "@/registry/miseui/ui/context-menu-classes"
import { cn } from "@/registry/miseui/lib/utils"

const ContextMenuContext = createContext<{ variant: ContextMenuVariant; effect?: ContextMenuEffect }>({ variant: "plain" })

type ContextMenuItemProps = React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  /** Destructive items read in the destructive colour so the eye slows down before pressing. */
  tone?: "default" | "destructive"
  /** Sits in a fixed column in `icon`. Beside the label in `plain` and `grouped`. `compact` has no room and leaves it out. */
  icon?: React.ReactNode
}

function ItemIcon({ icon, variant }: { icon: React.ReactNode; variant: ContextMenuVariant }) {
  if (variant === "compact") return null
  // `icon` always keeps the slot, or labels would start at two different places down the column.
  if (variant !== "icon" && !icon) return null
  return (
    <span aria-hidden="true" data-slot="context-menu-icon" className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
      {icon}
    </span>
  )
}

function ContextMenuItem({ className, tone = "default", icon, children, ...props }: ContextMenuItemProps) {
  const { variant } = useContext(ContextMenuContext)
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-tone={tone}
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], tone === "destructive" && DESTRUCTIVE_ITEM_CLASS, className)}
      {...props}
    >
      <ItemIcon icon={icon} variant={variant} />
      {children}
    </ContextMenuPrimitive.Item>
  )
}

function Indicator({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>{children}</ContextMenuPrimitive.ItemIndicator>
    </span>
  )
}

function ContextMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  const { variant } = useContext(ContextMenuContext)
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], INDICATOR_ITEM_CLASS, className)}
      {...props}
    >
      <Indicator>
        <Check aria-hidden="true" />
      </Indicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioGroup(props: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />
}

function ContextMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  const { variant } = useContext(ContextMenuContext)
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], INDICATOR_ITEM_CLASS, className)}
      {...props}
    >
      <Indicator>
        <Circle aria-hidden="true" className="size-2 fill-current" />
      </Indicator>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Label>) {
  const { variant } = useContext(ContextMenuContext)
  return <ContextMenuPrimitive.Label data-slot="context-menu-label" className={cn(LABEL_CLASS[variant], className)} {...props} />
}

function ContextMenuGroup({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  const { variant } = useContext(ContextMenuContext)
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" className={cn(GROUP_CLASS[variant], className)} {...props} />
}

/** `grouped` draws its dividers on the groups, so a separator there would double the line. */
function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  const { variant } = useContext(ContextMenuContext)
  if (variant === "grouped") return null
  return <ContextMenuPrimitive.Separator data-slot="context-menu-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

/** On touch there is no keyboard to press it with, so the hint would only take room from the label. */
function ContextMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="context-menu-shortcut" className={cn("ml-auto pl-4 text-xs text-muted-foreground tabular-nums pointer-coarse:hidden", className)} {...props} />
}

function ContextMenuQuickRow({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-quick-row" className={cn("-mx-1 mb-1 flex items-center gap-1 border-b px-1 pb-1", className)} {...props} />
}

type ContextMenuQuickItemProps = React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  /** Required: this row shows only a glyph, so the word has to reach assistive tech some other way. */
  "aria-label": string
}

function ContextMenuQuickItem({ className, ...props }: ContextMenuQuickItemProps) {
  return <ContextMenuPrimitive.Item data-slot="context-menu-quick-item" title={props["aria-label"]} className={cn(QUICK_ITEM_CLASS, className)} {...props} />
}

function ContextMenuSub(props: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub {...props} />
}

function ContextMenuSubTrigger({ className, children, icon, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & { icon?: React.ReactNode }) {
  const { variant } = useContext(ContextMenuContext)
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], "data-[state=open]:bg-accent", className)}
      {...props}
    >
      <ItemIcon icon={icon} variant={variant} />
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto text-muted-foreground" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

export {
  ContextMenuContext,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuQuickRow,
  ContextMenuQuickItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  type ContextMenuItemProps,
  type ContextMenuQuickItemProps,
}
