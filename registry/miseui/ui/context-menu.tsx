import type * as React from "react"
import { useContext, useMemo } from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"
import {
  MATERIALIZE_CLASS,
  PANEL_BASE_CLASS,
  PANEL_CLASS,
  PLAIN_MOTION_CLASS,
  TRIGGER_CLASS,
  type ContextMenuEffect,
  type ContextMenuVariant,
} from "@/registry/miseui/ui/context-menu-classes"
import {
  ContextMenuCheckboxItem,
  ContextMenuContext,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuQuickItem,
  ContextMenuQuickRow,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  type ContextMenuItemProps,
  type ContextMenuQuickItemProps,
} from "@/registry/miseui/ui/context-menu-items"
import { cn } from "@/registry/miseui/lib/utils"

const SUB_SIDE_OFFSET_PX = 4
/** Keeps menus off the screen edge on a phone. */
const COLLISION_PADDING_PX = 8

type ContextMenuProps = React.ComponentProps<typeof ContextMenuPrimitive.Root> & {
  /** `plain` standard rows, `compact` tight rows for dense tools, `grouped` labelled sections, `icon` a column of icons and a quick row. */
  variant?: ContextMenuVariant
  /** `materialize` brings the menu into focus from the point that was pressed. */
  effect?: ContextMenuEffect
}

function ContextMenu({ variant = "plain", effect, ...props }: ContextMenuProps) {
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  return (
    <ContextMenuContext.Provider value={context}>
      <ContextMenuPrimitive.Root {...props} />
    </ContextMenuContext.Provider>
  )
}

/** Focusable by default: the keyboard opens a context menu from whatever has focus, with Shift F10 or the Menu key. */
function ContextMenuTrigger({ className, disabled, tabIndex, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  const { variant, effect } = useContext(ContextMenuContext)
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu"
      data-variant={variant}
      data-effect={effect}
      disabled={disabled}
      tabIndex={disabled ? undefined : (tabIndex ?? 0)}
      className={cn(TRIGGER_CLASS, className)}
      {...props}
    />
  )
}

function useMotionClass() {
  const { effect } = useContext(ContextMenuContext)
  return effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS
}

function ContextMenuContent({
  className,
  collisionPadding = COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  const { variant, effect } = useContext(ContextMenuContext)
  const motionClass = useMotionClass()
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        data-variant={variant}
        data-effect={effect}
        collisionPadding={collisionPadding}
        className={cn(PANEL_BASE_CLASS, PANEL_CLASS[variant], motionClass, className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuSubContent({
  className,
  sideOffset = SUB_SIDE_OFFSET_PX,
  collisionPadding = COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  const { variant, effect } = useContext(ContextMenuContext)
  const motionClass = useMotionClass()
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        data-slot="context-menu-sub-content"
        data-effect={effect}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(PANEL_BASE_CLASS, PANEL_CLASS[variant], variant === "grouped" && "p-1", motionClass, className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
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
  ContextMenuSubContent,
  type ContextMenuProps,
  type ContextMenuItemProps,
  type ContextMenuQuickItemProps,
  type ContextMenuVariant,
  type ContextMenuEffect,
}
