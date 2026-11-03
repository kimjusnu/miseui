import type * as React from "react"
import { createContext, useContext, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuEffect,
} from "@/registry/miseui/ui/dropdown-menu"
import { cn } from "@/registry/miseui/lib/utils"

type ButtonGroupVariant = "plain" | "outline" | "split" | "pill"
type ButtonGroupOrientation = "horizontal" | "vertical"
type ButtonGroupEffect = "press"

/** Each surface is drawn once on the root, which is what makes one shared border possible. */
const ROOT_CLASS: Record<ButtonGroupVariant, string> = {
  plain: "rounded-md bg-foreground/[0.06] divide-foreground/10",
  outline: "rounded-md border bg-background shadow-xs",
  split: "rounded-md bg-mise text-mise-foreground shadow-xs divide-mise-foreground/25",
  pill: "gap-1 rounded-3xl border bg-background p-1 shadow-xs",
}

const ORIENTATION_CLASS: Record<ButtonGroupOrientation, string> = {
  horizontal: "max-w-full",
  vertical: "flex-col",
}

const DIVIDE_CLASS: Record<ButtonGroupOrientation, string> = {
  horizontal: "divide-x",
  vertical: "divide-y",
}

const ITEM_CLASS: Record<ButtonGroupVariant, string> = {
  plain: "h-9 px-3 hover:bg-foreground/[0.06] active:bg-foreground/10 pointer-coarse:h-10",
  outline: "h-9 px-3 hover:bg-accent active:bg-accent/70 data-[state=open]:bg-accent pointer-coarse:h-10",
  split:
    "h-9 px-4 hover:bg-mise-foreground/10 active:bg-mise-foreground/[0.15] data-[state=open]:bg-mise-foreground/[0.15] pointer-coarse:h-10",
  pill: "h-8 rounded-full px-3 text-[13px] hover:bg-accent active:bg-accent/70 data-[state=open]:bg-accent pointer-coarse:h-10",
}

/** The shell of a joined group must not move, so the press dips the label and leaves every border where it is. */
const PRESS_LABEL_CLASS =
  "transition-[scale] duration-(--duration-base) ease-(--ease-mise-out) group-active/item:scale-[0.94] group-active/item:duration-0 motion-reduce:group-active/item:scale-100"

function joinedCorners(variant: ButtonGroupVariant, orientation: ButtonGroupOrientation) {
  if (variant === "pill") return orientation === "vertical" ? "w-full justify-start" : undefined
  return orientation === "vertical"
    ? "w-full justify-start first:rounded-t-[inherit] last:rounded-b-[inherit]"
    : "first:rounded-l-[inherit] last:rounded-r-[inherit]"
}

function itemClass(variant: ButtonGroupVariant, orientation: ButtonGroupOrientation) {
  return cn(
    "group/item relative inline-flex min-w-0 items-center justify-center overflow-hidden text-sm font-medium whitespace-nowrap outline-none select-none",
    "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise) active:duration-0",
    "focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    ITEM_CLASS[variant],
    joinedCorners(variant, orientation),
  )
}

interface ButtonGroupContextValue {
  variant: ButtonGroupVariant
  orientation: ButtonGroupOrientation
  press: boolean
}

const ButtonGroupContext = createContext<ButtonGroupContextValue>({
  variant: "outline",
  orientation: "horizontal",
  press: false,
})

type ButtonGroupProps = React.ComponentProps<"div"> & {
  /** `plain` one quiet fill, `outline` one shared hairline, `split` a main action in the accent with its menu, `pill` separate rounded actions in one tray. */
  variant?: ButtonGroupVariant
  orientation?: ButtonGroupOrientation
  /** `press` dips the pressed label while the shared border stays still. */
  effect?: ButtonGroupEffect
}

function ButtonGroup({ variant = "outline", orientation = "horizontal", effect, className, ...props }: ButtonGroupProps) {
  const press = effect === "press"
  const context = useMemo(() => ({ variant, orientation, press }), [variant, orientation, press])
  return (
    <ButtonGroupContext.Provider value={context}>
      <div
        role="group"
        data-slot="button-group"
        data-variant={variant}
        data-orientation={orientation}
        data-effect={effect}
        className={cn(
          "isolate inline-flex min-w-0",
          ORIENTATION_CLASS[orientation],
          variant !== "pill" && DIVIDE_CLASS[orientation],
          ROOT_CLASS[variant],
          className,
        )}
        {...props}
      />
    </ButtonGroupContext.Provider>
  )
}

function ButtonGroupItem({ className, children, type = "button", ...props }: React.ComponentProps<"button">) {
  const { variant, orientation, press } = useContext(ButtonGroupContext)
  return (
    <button type={type} data-slot="button-group-item" className={cn(itemClass(variant, orientation), className)} {...props}>
      <span data-slot="button-group-label" className={cn("inline-flex min-w-0 items-center gap-2", press && PRESS_LABEL_CLASS)}>
        {children}
      </span>
    </button>
  )
}

type ButtonGroupMenuProps = {
  /** The name of the arrow button, such as "More publish options". It has no text of its own. */
  label: string
  /** DropdownMenuItem rows. */
  children: React.ReactNode
  /** Passed to the menu: `materialize` or `spring`. */
  effect?: DropdownMenuEffect
  align?: DropdownMenuContentProps["align"]
  disabled?: boolean
  className?: string
  contentClassName?: string
}

function ButtonGroupMenu({ label, children, effect, align = "end", disabled, className, contentClassName }: ButtonGroupMenuProps) {
  const { variant, orientation } = useContext(ButtonGroupContext)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        disabled={disabled}
        data-slot="button-group-menu"
        className={cn(itemClass(variant, orientation), "px-0", orientation === "vertical" ? "justify-center" : "w-9 shrink-0 pointer-coarse:w-10", className)}
      >
        <ChevronDown className="transition-transform duration-(--duration-fast) ease-(--ease-mise) group-data-[state=open]/item:rotate-180 motion-reduce:transition-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} effect={effect} className={contentClassName}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  ButtonGroup,
  ButtonGroupItem,
  ButtonGroupMenu,
  type ButtonGroupProps,
  type ButtonGroupMenuProps,
  type ButtonGroupVariant,
  type ButtonGroupOrientation,
  type ButtonGroupEffect,
}
