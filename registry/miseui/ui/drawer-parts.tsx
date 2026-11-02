import type * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("grid shrink-0 gap-1 p-4 pe-12", className)} {...props} />
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-4 text-sm/6", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("flex shrink-0 flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="drawer-title" className={cn("text-[15px] font-semibold", className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { DrawerHeader, DrawerBody, DrawerFooter, DrawerTitle, DrawerDescription }
