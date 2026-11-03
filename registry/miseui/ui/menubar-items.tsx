import type * as React from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"
import { Check, ChevronRight, Circle } from "lucide-react"
import { DESTRUCTIVE_ITEM_CLASS, INDICATOR_ITEM_CLASS, ITEM_CLASS } from "@/registry/miseui/ui/menubar-classes"
import { cn } from "@/registry/miseui/lib/utils"

type MenubarItemProps = React.ComponentProps<typeof MenubarPrimitive.Item> & {
  /** Destructive items read in the destructive colour so the eye slows down before clicking. */
  variant?: "default" | "destructive"
}

function MenubarItem({ className, variant = "default", ...props }: MenubarItemProps) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-variant={variant}
      className={cn(ITEM_CLASS, variant === "destructive" && DESTRUCTIVE_ITEM_CLASS, className)}
      {...props}
    />
  )
}

function Indicator({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>{children}</MenubarPrimitive.ItemIndicator>
    </span>
  )
}

function MenubarCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem data-slot="menubar-checkbox-item" className={cn(ITEM_CLASS, INDICATOR_ITEM_CLASS, className)} {...props}>
      <Indicator>
        <Check aria-hidden="true" />
      </Indicator>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioGroup(props: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
}

function MenubarRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem data-slot="menubar-radio-item" className={cn(ITEM_CLASS, INDICATOR_ITEM_CLASS, className)} {...props}>
      <Indicator>
        <Circle aria-hidden="true" className="size-2 fill-current" />
      </Indicator>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Label>) {
  return <MenubarPrimitive.Label data-slot="menubar-label" className={cn("px-2 py-1.5 text-[13px] text-muted-foreground", className)} {...props} />
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return <MenubarPrimitive.Separator data-slot="menubar-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

/** On touch there is no keyboard to press it with, so the hint would only take room from the label. */
function MenubarShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="menubar-shortcut" className={cn("ml-auto pl-4 text-xs text-muted-foreground tabular-nums pointer-coarse:hidden", className)} {...props} />
}

function MenubarSubTrigger({ className, children, ...props }: React.ComponentProps<typeof MenubarPrimitive.SubTrigger>) {
  return (
    <MenubarPrimitive.SubTrigger data-slot="menubar-sub-trigger" className={cn(ITEM_CLASS, "data-[state=open]:bg-accent", className)} {...props}>
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto text-muted-foreground" />
    </MenubarPrimitive.SubTrigger>
  )
}

export {
  MenubarCheckboxItem,
  MenubarItem,
  MenubarLabel,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSubTrigger,
  type MenubarItemProps,
}
