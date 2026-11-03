import type * as React from "react"
import { useContext, useMemo, useRef } from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { AlertTriangle } from "lucide-react"
import { AlertDialogConfirmField, ConfirmContext, ConfirmScope, RootContext } from "@/registry/miseui/ui/alert-dialog-confirm"
import {
  BUTTON_FIT_CLASS,
  COMPACT_ACTION_TONE,
  COMPACT_BUTTON_CLASS,
  FOOTER_CLASS,
  HEADER_CLASS,
  MATERIALIZE_CLASS,
  OVERLAY_CLASS,
  PLAIN_MOTION_CLASS,
  SHELL_CLASS,
  VARIANT_SHELL_CLASS,
  matchesConfirmation,
  type AlertDialogEffect,
  type AlertDialogTone,
  type AlertDialogVariant,
} from "@/registry/miseui/ui/alert-dialog-classes"
import { buttonVariants } from "@/registry/miseui/ui/button"
import { cn } from "@/registry/miseui/lib/utils"

type AlertDialogProps = React.ComponentProps<typeof AlertDialogPrimitive.Root> & {
  /** `plain` a calm question, `destructive` a warning mark and a red action, `typed` a word must be typed first, `compact` a small centred alert with joined buttons. */
  variant?: AlertDialogVariant
  /** `materialize` brings the surface into focus with scale, blur and opacity together. */
  effect?: AlertDialogEffect
  /** Colours the action. `destructive` and `typed` default to destructive, the others to neutral. */
  tone?: AlertDialogTone
  /** With `typed`: what has to be typed before the action unlocks. */
  confirmWord?: string
}

function AlertDialog({ variant = "plain", effect, tone, confirmWord, ...props }: AlertDialogProps) {
  const resolvedTone = tone ?? (variant === "destructive" || variant === "typed" ? "destructive" : "neutral")
  const context = useMemo(() => ({ variant, effect, tone: resolvedTone, confirmWord }), [variant, effect, resolvedTone, confirmWord])
  return (
    <RootContext.Provider value={context}>
      <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
    </RootContext.Provider>
  )
}

function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogContent({ className, children, onOpenAutoFocus, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  const { variant, effect, tone } = useContext(RootContext)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={OVERLAY_CLASS} />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-variant={variant}
        data-effect={effect}
        data-tone={tone}
        // Radix focuses Cancel, the safe answer. Typing is just as safe and is the only way forward, so `typed` starts there.
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented || variant !== "typed" || !inputRef.current) return
          event.preventDefault()
          inputRef.current.focus()
        }}
        className={cn(SHELL_CLASS, VARIANT_SHELL_CLASS[variant], effect === "materialize" ? MATERIALIZE_CLASS : PLAIN_MOTION_CLASS, className)}
        {...props}
      >
        <ConfirmScope inputRef={inputRef}>{children}</ConfirmScope>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const { variant } = useContext(RootContext)
  return (
    <div data-slot="alert-dialog-header" className={cn(HEADER_CLASS[variant], className)} {...props}>
      {variant === "destructive" ? (
        <>
          <span aria-hidden="true" data-slot="alert-dialog-mark" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/15">
            <AlertTriangle className="size-5" />
          </span>
          <div className="grid min-w-0 gap-2">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  )
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn("text-[15px] leading-6 font-semibold text-foreground", className)} {...props} />
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn("text-sm leading-5 text-muted-foreground", className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { variant } = useContext(RootContext)
  return <div data-slot="alert-dialog-footer" className={cn(FOOTER_CLASS[variant], className)} {...props} />
}

/** To keep the dialog open during async work, call `event.preventDefault()` in onClick and close it yourself. */
function AlertDialogAction({ className, disabled, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  const { variant, tone, confirmWord } = useContext(RootContext)
  const confirm = useContext(ConfirmContext)
  const locked = variant === "typed" && confirmWord !== undefined && !matchesConfirmation(confirm?.typed ?? "", confirmWord)
  const look =
    variant === "compact"
      ? cn(COMPACT_BUTTON_CLASS, COMPACT_ACTION_TONE[tone])
      : cn(
          buttonVariants({ variant: tone === "destructive" ? "destructive" : "default" }),
          BUTTON_FIT_CLASS,
          // The dark error colour is too light for the white text the button brings.
          tone === "destructive" && "dark:text-background",
        )
  return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" data-tone={tone} disabled={disabled || locked} className={cn(look, className)} {...props} />
}

function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  const { variant } = useContext(RootContext)
  const look = variant === "compact" ? cn(COMPACT_BUTTON_CLASS, "text-foreground") : cn(buttonVariants({ variant: "outline" }), BUTTON_FIT_CLASS)
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(look, className)} {...props} />
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogConfirmField,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  matchesConfirmation,
  type AlertDialogProps,
  type AlertDialogVariant,
  type AlertDialogEffect,
  type AlertDialogTone,
}
