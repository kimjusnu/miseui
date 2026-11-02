import type * as React from "react"
import { isValidElement, useId, useMemo } from "react"
import { motion } from "motion/react"
import { Label } from "@/registry/miseui/ui/label"
import {
  FieldContext,
  FieldControl,
  FieldError,
  joinIds,
  renderControl,
  useFieldShake,
  type FieldControlWiring,
  type FieldEffect,
  type FieldVariant,
} from "@/registry/miseui/ui/field-parts"
import { cn } from "@/registry/miseui/lib/utils"

/**
 * Resting state only: the label starts floated, so anything that is not an empty input (a select, a switch,
 * an input with a value) simply shows a small label. The selector targets the frame around label and control.
 */
const FLOATING_LABEL_CLASS = cn(
  "pointer-events-none absolute top-2 left-3 z-10 origin-top-left scale-[0.85] font-normal text-muted-foreground",
  "transition-[translate,scale] duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none",
  "[[data-slot=field-control]:has(:placeholder-shown):not(:focus-within)>&]:translate-y-[9px]",
  "[[data-slot=field-control]:has(:placeholder-shown):not(:focus-within)>&]:scale-100",
)

/** Only the text dims: a disabled control already dims itself, and dimming both would fade it twice. */
const DISABLED_TEXT_CLASS =
  "data-[disabled=true]:[&_[data-slot=field-description]]:opacity-50 data-[disabled=true]:[&_[data-slot=label]]:opacity-50"

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** Stays visible next to any error, so the guidance is not lost at the moment it is needed. */
  description?: React.ReactNode
  /** Makes the control invalid and shows the text. */
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  /** `stacked` top to bottom, `inline` label left, `floating` label inside the input, `card` bordered settings row. */
  variant?: FieldVariant
  /** `shake-error` shakes the control when an error arrives; `materialize` grows the error in. */
  effect?: FieldEffect
  /** One control, wired through cloneElement. Use `FieldControl` when it sits inside a wrapper. */
  children: React.ReactNode
}

function controlIdOf(children: React.ReactNode, fallback: string) {
  if (!isValidElement<{ id?: string }>(children)) return fallback
  return children.props.id ?? fallback
}

function useFieldWiring({ children, description, error, required, disabled }: FieldProps) {
  const generatedId = useId()
  const controlId = controlIdOf(children, `${generatedId}-control`)
  const labelId = `${generatedId}-label`
  const descriptionId = `${generatedId}-description`
  const errorId = `${generatedId}-error`
  const hasDescription = Boolean(description)
  const hasError = Boolean(error)
  const wiring = useMemo<FieldControlWiring>(
    () => ({
      id: controlId,
      "aria-labelledby": labelId,
      "aria-describedby": joinIds(hasDescription ? descriptionId : null, hasError ? errorId : null),
      "aria-invalid": hasError ? true : undefined,
      "aria-required": required ? true : undefined,
      disabled: disabled ? true : undefined,
    }),
    [controlId, labelId, hasDescription, descriptionId, hasError, errorId, required, disabled],
  )
  return { wiring, descriptionId, errorId }
}

interface FieldParts {
  labelNode: React.ReactNode
  descriptionNode: React.ReactNode
  controlNode: React.ReactNode
  errorNode: React.ReactNode
}

/** The four arrangements, because the same four parts mean different things in each. */
function FieldLayout({ variant, labelNode, descriptionNode, controlNode, errorNode }: FieldParts & { variant: FieldVariant }) {
  if (variant === "inline") {
    return (
      <div data-slot="field-grid" className="grid gap-2 @sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] @sm:gap-4">
        <div data-slot="field-label-column" className="@sm:pt-2">
          {labelNode}
        </div>
        <div className="grid min-w-0 gap-2">
          {controlNode}
          {descriptionNode}
          {errorNode}
        </div>
      </div>
    )
  }
  if (variant === "card") {
    return (
      <div className="grid gap-2 rounded-lg border p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div data-slot="field-label-column" className="grid min-w-0 flex-1 basis-40 gap-1">
            {labelNode}
            {descriptionNode}
          </div>
          {controlNode}
        </div>
        {errorNode}
      </div>
    )
  }
  return (
    <div className="grid min-w-0 gap-2">
      {variant === "stacked" ? labelNode : null}
      {controlNode}
      {descriptionNode}
      {errorNode}
    </div>
  )
}

function FieldLabel({ wiring, floating, required, children }: { wiring: FieldControlWiring; floating: boolean; required: boolean; children: React.ReactNode }) {
  return (
    <Label
      id={wiring["aria-labelledby"]}
      htmlFor={wiring.id}
      className={floating ? FLOATING_LABEL_CLASS : "leading-5"}
    >
      <span className="min-w-0">{children}</span>
      {required ? (
        <span data-slot="field-required" aria-hidden="true" className="-ml-1 text-destructive">
          *
        </span>
      ) : null}
    </Label>
  )
}

function Field(fieldProps: FieldProps) {
  const { label, description, error, required = false, disabled = false, variant = "stacked", effect, className, children, ...props } = fieldProps
  const { wiring, descriptionId, errorId } = useFieldWiring(fieldProps)
  const floating = variant === "floating"
  const scope = useFieldShake(error, effect === "shake-error")
  const labelNode = (
    <FieldLabel wiring={wiring} floating={floating} required={required}>
      {label}
    </FieldLabel>
  )
  const descriptionNode = description ? (
    <p id={descriptionId} data-slot="field-description" className="text-[13px] leading-5 text-muted-foreground">
      {description}
    </p>
  ) : null
  const controlNode = (
    <motion.div ref={scope} data-slot="field-control" className={cn("relative min-w-0", variant === "card" && "shrink-0")}>
      {renderControl(children, wiring, floating)}
      {floating ? labelNode : null}
    </motion.div>
  )
  const errorNode = <FieldError id={errorId} error={error} materialize={effect === "materialize"} />
  return (
    <FieldContext.Provider value={wiring}>
      <div
        data-slot="field"
        data-variant={variant}
        data-effect={effect}
        data-disabled={disabled ? "true" : undefined}
        // Container query, not media query: a field in a narrow sidebar must stack even on a wide screen.
        className={cn("@container w-full min-w-0", DISABLED_TEXT_CLASS, className)}
        {...props}
      >
        <FieldLayout variant={variant} {...{ labelNode, descriptionNode, controlNode, errorNode }} />
      </div>
    </FieldContext.Provider>
  )
}

export { Field, FieldControl, type FieldProps, type FieldVariant, type FieldEffect }
