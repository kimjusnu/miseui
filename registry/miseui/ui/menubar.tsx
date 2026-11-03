import type * as React from "react"
import { createContext, useContext, useMemo } from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"
import {
  BAR_CLASS,
  MATERIALIZE_CLASS,
  PANEL_CLASS,
  PLAIN_MOTION_CLASS,
  TRIGGER_BASE_CLASS,
  TRIGGER_CLASS,
  type MenubarEffect,
  type MenubarVariant,
} from "@/registry/miseui/ui/menubar-classes"
import {
  MenubarCheckboxItem,
  MenubarItem,
  MenubarLabel,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSubTrigger,
  type MenubarItemProps,
} from "@/registry/miseui/ui/menubar-items"
import { cn } from "@/registry/miseui/lib/utils"

const MenubarContext = createContext<{ variant: MenubarVariant; effect?: MenubarEffect }>({ variant: "plain" })

const SIDE_OFFSET_PX = 4
const SUB_SIDE_OFFSET_PX = 4
/** Keeps menus off the screen edge on a phone. */
const COLLISION_PADDING_PX = 8

type MenubarProps = Omit<React.ComponentProps<typeof MenubarPrimitive.Root>, "title"> & {
  /** `plain` a bordered bar, `ghost` words only, `pill` a rounded track, `app` a document title above its menus. */
  variant?: MenubarVariant
  /** `materialize` brings menus into focus from the trigger they belong to. */
  effect?: MenubarEffect
  /** The document name in the title row of `app`. */
  title?: React.ReactNode
  /** Right side of the title row of `app`, such as a share button. */
  actions?: React.ReactNode
}

function Menubar({ variant = "plain", effect, title, actions, className, ...props }: MenubarProps) {
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  const bar = (
    <MenubarPrimitive.Root
      data-slot="menubar"
      data-variant={variant}
      data-effect={effect}
      className={cn(BAR_CLASS[variant], variant !== "app" && className)}
      {...props}
    />
  )
  return (
    <MenubarContext.Provider value={context}>
      {variant === "app" ? (
        <div data-slot="menubar-window" className={cn("grid min-w-0 gap-1 border-b pt-2 pb-1", className)}>
          <div data-slot="menubar-title" className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3">
            <div className="min-w-0 text-[15px] leading-6 font-medium wrap-anywhere">{title}</div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
          {bar}
        </div>
      ) : (
        bar
      )}
    </MenubarContext.Provider>
  )
}

function MenubarMenu(props: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  const { variant } = useContext(MenubarContext)
  return <MenubarPrimitive.Trigger data-slot="menubar-trigger" className={cn(TRIGGER_BASE_CLASS, TRIGGER_CLASS[variant], className)} {...props} />
}

function motionClass(effect: MenubarEffect | undefined) {
  return effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS
}

function MenubarContent({
  className,
  align = "start",
  sideOffset = SIDE_OFFSET_PX,
  collisionPadding = COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  const { effect } = useContext(MenubarContext)
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        data-effect={effect}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(PANEL_CLASS, motionClass(effect), className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
}

function MenubarGroup(props: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarSub(props: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubContent({
  className,
  sideOffset = SUB_SIDE_OFFSET_PX,
  collisionPadding = COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  const { effect } = useContext(MenubarContext)
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        data-slot="menubar-sub-content"
        data-effect={effect}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(PANEL_CLASS, motionClass(effect), className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
}

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarGroup,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  type MenubarProps,
  type MenubarItemProps,
  type MenubarVariant,
  type MenubarEffect,
}
