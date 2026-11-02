import type * as React from "react"
import { cloneElement, createContext, isValidElement, useContext, useEffect } from "react"
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type FieldVariant = "stacked" | "inline" | "floating" | "card"
type FieldEffect = "shake-error" | "materialize"

interface FieldControlWiring {
  id: string
  "aria-labelledby": string
  "aria-describedby"?: string
  "aria-invalid"?: true
  "aria-required"?: true
  disabled?: true
}

const FieldContext = createContext<FieldControlWiring | null>(null)

const SHAKE_X_PX = [0, -6, 6, -4, 4, 0]
const SHAKE_SECONDS = 0.32
/** Room for the small floated label above the typed text. */
const FLOATING_CONTROL_CLASS =
  "h-12 pt-5 pb-1 placeholder:text-transparent focus-visible:placeholder:text-muted-foreground"

type AnyProps = Record<string, unknown>

function joinIds(...ids: readonly unknown[]) {
  const joined = ids.filter(Boolean).join(" ")
  return joined || undefined
}

/** The child's own values win or merge, so a control that was already wired keeps working. */
function wireControl(child: React.ReactElement<AnyProps>, wiring: FieldControlWiring, floating: boolean) {
  const { props } = child
  const floatingProps = floating
    ? {
        className: cn(props.className as string | undefined, FLOATING_CONTROL_CLASS),
        // :placeholder-shown is how the label senses an empty field; it needs a placeholder to exist at all.
        placeholder: props.placeholder ?? " ",
      }
    : {}
  return cloneElement(child, {
    ...wiring,
    ...floatingProps,
    id: props.id ?? wiring.id,
    "aria-describedby": joinIds(props["aria-describedby"], wiring["aria-describedby"]),
    "aria-invalid": props["aria-invalid"] ?? wiring["aria-invalid"],
    "aria-required": props["aria-required"] ?? wiring["aria-required"],
    disabled: props.disabled ?? wiring.disabled,
  })
}

function renderControl(children: React.ReactNode, wiring: FieldControlWiring, floating: boolean) {
  if (!isValidElement<AnyProps>(children)) return children
  return wireControl(children, wiring, floating)
}

/** For a control nested inside a root that swallows props, such as `SelectTrigger` inside `Select`. */
function FieldControl({ children }: { children: React.ReactElement<AnyProps> }) {
  const wiring = useContext(FieldContext)
  return wiring ? wireControl(children, wiring, false) : children
}

function useFieldShake(error: React.ReactNode, enabled: boolean) {
  const reduceMotion = useReducedMotion() ?? false
  const [scope, animate] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (!enabled || !error || reduceMotion || !scope.current) return
    animate(scope.current, { x: SHAKE_X_PX }, { duration: SHAKE_SECONDS, ease: "easeOut" })
  }, [error, enabled, reduceMotion, animate, scope])
  return scope
}

const ERROR_CLASS = "text-[13px] leading-5 text-destructive"

interface FieldErrorProps {
  id: string
  error: React.ReactNode
  materialize: boolean
}

function MaterializingError({ id, error }: Pick<FieldErrorProps, "id" | "error">) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <AnimatePresence initial={false}>
      {error ? (
        <motion.p
          key="error"
          id={id}
          data-slot="field-error"
          data-materialize={reduceMotion ? "false" : "true"}
          className={cn(ERROR_CLASS, "overflow-hidden")}
          initial={reduceMotion ? false : { height: 0, opacity: 0, filter: "blur(4px)" }}
          animate={reduceMotion ? undefined : { height: "auto", opacity: 1, filter: "blur(0px)" }}
          exit={reduceMotion ? undefined : { height: 0, opacity: 0, filter: "blur(4px)" }}
          transition={SPRING_DEFAULT}
        >
          {error}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

/** The live region is always mounted: a region that appears with its own text is often not announced. */
function FieldError({ id, error, materialize }: FieldErrorProps) {
  return (
    <div data-slot="field-live" aria-live="polite">
      {materialize ? (
        <MaterializingError id={id} error={error} />
      ) : error ? (
        <p id={id} data-slot="field-error" className={ERROR_CLASS}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

export {
  FieldContext,
  FieldControl,
  FieldError,
  joinIds,
  renderControl,
  useFieldShake,
  type FieldControlWiring,
  type FieldEffect,
  type FieldVariant,
}
