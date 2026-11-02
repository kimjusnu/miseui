import type * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

const PLAIN_CONTENT_MOTION_CLASS = [
  "duration-(--duration-base) ease-(--ease-mise)",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
]

/**
 * Radix exposes no transform-origin for a dialog, since it has no anchor, so the surface grows from its own centre.
 * The enter and exit values stay unqualified so the media overrides below win on source order.
 */
const MATERIALIZE_CLASS = [
  "duration-(--duration-slow) ease-(--ease-mise-out) will-change-[transform,opacity,filter]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-(--duration-base)",
  "fade-in-0 zoom-in-90 blur-in-md fade-out-0 zoom-out-90 blur-out-md",
  "motion-reduce:zoom-in-100 motion-reduce:zoom-out-100 motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
]

/**
 * A registry component cannot own the app root, so the page cannot really scale back. The overlay fakes that
 * depth: the blur radius grows, and the page loses brightness and colour, as an out-of-focus background does.
 * `blur(0px)` rather than `backdrop-blur-none`: only filter lists of the same shape interpolate.
 */
const SCRIM_BLUR_CLASS = [
  "bg-background/40 backdrop-blur-xl backdrop-brightness-75 backdrop-saturate-50",
  "transition-[backdrop-filter] duration-(--duration-slow) ease-(--ease-mise-out)",
  "starting:backdrop-blur-[0px] data-[state=closed]:backdrop-blur-[0px] data-[state=closed]:duration-(--duration-base)",
  "motion-reduce:transition-none",
  "[@media(prefers-reduced-transparency:reduce)]:bg-background/90 [@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none",
]

type DialogEffect = "materialize" | "scrim-blur"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay> & {
  /** `scrim-blur` pushes the page back behind a deep blur; DialogContent passes its own effect through. */
  effect?: DialogEffect
}

function DialogOverlay({ className, effect, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      data-effect={effect}
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        "duration-(--duration-base) ease-(--ease-mise)",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        effect === "scrim-blur" && SCRIM_BLUR_CLASS,
        className,
      )}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Hide the corner close button when the footer already offers a way out. */
  showCloseButton?: boolean
  /** `materialize` brings the surface into focus; `scrim-blur` pushes the page back behind it. */
  effect?: DialogEffect
}

function DialogContent({ className, children, showCloseButton = true, effect, ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay effect={effect} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-effect={effect}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg",
          effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_CONTENT_MOTION_CLASS,
          effect === "scrim-blur" && "shadow-2xl",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background",
              "transition-opacity duration-(--duration-fast) ease-(--ease-mise) hover:opacity-100",
              "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden",
              "disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            )}
          >
            <X />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogContentProps,
  type DialogOverlayProps,
  type DialogEffect,
}
