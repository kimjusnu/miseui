import type * as React from "react"
import { createContext, useContext, useId, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import {
  ADDON_CLASS,
  BUTTON_BASE_CLASS,
  BUTTON_SHAPE_CLASS,
  BUTTON_TONE_CLASS,
  CHEVRON_CLASS,
  FIELD_STATE_CLASS,
  INPUT_BASE_CLASS,
  INPUT_CLASS,
  ROOT_CLASS,
  SELECT_CLASS,
  SELECT_WRAP_CLASS,
  shouldFocusField,
  type InputGroupVariant,
} from "@/registry/miseui/ui/input-group-classes"
import { cn } from "@/registry/miseui/lib/utils"

interface InputGroupContextValue {
  variant: InputGroupVariant
  inputId: string
  /** The name for the input when the label is not drawn. */
  fallbackName: string | undefined
  disabled: boolean
}

const InputGroupContext = createContext<InputGroupContextValue>({
  variant: "attached",
  inputId: "",
  fallbackName: undefined,
  disabled: false,
})

const DRAWS_LABEL: Record<InputGroupVariant, boolean> = { attached: false, inset: false, stacked: true, inline: true }

type InputGroupProps = React.ComponentProps<"div"> & {
  /** `attached` addons as tinted cells with hairlines, `inset` addons inside the field, `stacked` label over the value in one box, `inline` label and value on one filled row. */
  variant?: InputGroupVariant
  /** Drawn by `stacked` and `inline`. The other two leave it to a surrounding Field and use it as the input's name. */
  label?: string
  /** Disables the input and every control in the group. */
  disabled?: boolean
}

function InputGroup({ variant = "attached", label, disabled = false, className, children, onMouseDown, ...props }: InputGroupProps) {
  const inputId = useId()
  const drawsLabel = DRAWS_LABEL[variant] && Boolean(label)
  const context = useMemo(
    () => ({ variant, inputId, fallbackName: drawsLabel ? undefined : label, disabled }),
    [variant, inputId, drawsLabel, label, disabled],
  )
  const visibleLabel = drawsLabel ? (
    <label htmlFor={inputId} data-slot="input-group-label" className={cn("text-[13px] leading-5", variant === "inline" ? "shrink-0 text-foreground" : "text-muted-foreground")}>
      {label}
    </label>
  ) : null
  return (
    <InputGroupContext.Provider value={context}>
      <div
        role="group"
        aria-label={label}
        data-slot="input-group"
        data-variant={variant}
        className={cn("w-full min-w-0", ROOT_CLASS[variant], FIELD_STATE_CLASS, className)}
        // Mouse, not pointer: a touch that starts a scroll must not pop the keyboard open. preventDefault keeps an already focused input from blurring.
        onMouseDown={(event) => {
          onMouseDown?.(event)
          if (event.defaultPrevented || !shouldFocusField(event.target as Element)) return
          event.preventDefault()
          event.currentTarget.querySelector<HTMLInputElement>("[data-slot='input-group-input']")?.focus()
        }}
        {...props}
      >
        {visibleLabel}
        {variant === "stacked" || variant === "inline" ? (
          <div data-slot="input-group-row" className="flex min-w-0 flex-1 items-center gap-2">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </InputGroupContext.Provider>
  )
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"span">) {
  const { variant } = useContext(InputGroupContext)
  return (
    <span
      data-slot="input-group-addon"
      className={cn("text-sm text-muted-foreground select-none [&_svg]:size-4 [&_svg]:shrink-0", ADDON_CLASS[variant], className)}
      {...props}
    />
  )
}

function InputGroupInput({ className, id, disabled, "aria-label": ariaLabel, ...props }: React.ComponentProps<"input">) {
  const { variant, inputId, fallbackName, disabled: groupDisabled } = useContext(InputGroupContext)
  return (
    <input
      id={id ?? inputId}
      aria-label={ariaLabel ?? fallbackName}
      disabled={disabled || groupDisabled}
      data-slot="input-group-input"
      className={cn(INPUT_BASE_CLASS, INPUT_CLASS[variant], className)}
      {...props}
    />
  )
}

type InputGroupButtonProps = React.ComponentProps<"button"> & {
  /** The main action of the field, in the accent. */
  primary?: boolean
}

function InputGroupButton({ className, primary = false, disabled, type = "button", ...props }: InputGroupButtonProps) {
  const { variant, disabled: groupDisabled } = useContext(InputGroupContext)
  return (
    <button
      type={type}
      data-slot="input-group-button"
      data-primary={primary ? "true" : undefined}
      disabled={disabled || groupDisabled}
      className={cn(BUTTON_BASE_CLASS, BUTTON_SHAPE_CLASS[variant], BUTTON_TONE_CLASS[primary ? "primary" : "quiet"], className)}
      {...props}
    />
  )
}

/** The name is required: nothing else in the field says what this choice is. */
type InputGroupSelectProps = Omit<React.ComponentProps<"select">, "aria-label"> & { "aria-label": string }

/** A native select on purpose: on a phone it opens the system picker, which is what people expect inside a field. */
function InputGroupSelect({ className, disabled, children, ...props }: InputGroupSelectProps) {
  const { variant, disabled: groupDisabled } = useContext(InputGroupContext)
  return (
    <span data-slot="input-group-select" className={cn("relative flex shrink-0 items-center", SELECT_WRAP_CLASS[variant])}>
      <select
        disabled={disabled || groupDisabled}
        className={cn(
          "h-full cursor-pointer appearance-none bg-transparent text-base text-foreground outline-none md:text-sm disabled:cursor-not-allowed",
          SELECT_CLASS[variant],
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className={cn("pointer-events-none absolute size-3.5 text-muted-foreground", CHEVRON_CLASS[variant])} />
    </span>
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupSelect,
  type InputGroupProps,
  type InputGroupButtonProps,
  type InputGroupSelectProps,
  type InputGroupVariant,
}
