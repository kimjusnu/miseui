import type * as React from "react"
import { useEffect, useImperativeHandle } from "react"
import { useAnimate, motion, useReducedMotion } from "motion/react"
import { OtpBox, type InputOTPVariant } from "@/registry/miseui/ui/input-otp-box"
import { useOtpHandlers, useOtpState, type InputOTPMode } from "@/registry/miseui/ui/input-otp-state"
import { cn } from "@/registry/miseui/lib/utils"

type InputOTPEffect = "pop"

const DEFAULT_LENGTH = 6
const SHAKE_X_PX = [0, -6, 6, -4, 4, 0]
const SHAKE_SECONDS = 0.32

const ROW_CLASS: Record<InputOTPVariant, string> = {
  boxes: "gap-2",
  joined: "",
  underline: "gap-2",
  "dotted-mask": "gap-1",
}

/** Plays once per error; a repeat needs the owner to clear `error` first, which is what a retry does anyway. */
function useShakeOnError(invalid: boolean, reduceMotion: boolean) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (!invalid || reduceMotion || !scope.current) return
    animate(scope.current, { x: SHAKE_X_PX }, { duration: SHAKE_SECONDS, ease: "easeOut" })
  }, [invalid, reduceMotion, animate, scope])
  return scope
}

interface OtpRowProps {
  length: number
  variant: InputOTPVariant
  text: string
  focused: boolean
  selection: readonly [number, number]
  invalid: boolean
  pop: boolean
  reduceMotion: boolean
}

function OtpRow({ length, variant, text, focused, selection, invalid, pop, reduceMotion }: OtpRowProps) {
  const [start, end] = selection
  const collapsed = start === end
  return (
    <div aria-hidden="true" className={cn("flex w-full", ROW_CLASS[variant])}>
      {Array.from({ length }, (_, index) => {
        const active = focused && (collapsed ? index === start : index >= start && index < end)
        return (
          <OtpBox
            key={index}
            variant={variant}
            char={text[index]}
            active={active}
            caret={active && collapsed}
            invalid={invalid}
            pop={pop}
            reduceMotion={reduceMotion}
          />
        )
      })}
    </div>
  )
}

type InputOTPProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "size"> & {
  /** How many characters the code has. */
  length?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Fires when the last character lands, so a form can submit itself. */
  onComplete?: (value: string) => void
  /** `numeric` opens the number pad; `alphanumeric` accepts letters too and upper-cases them. */
  mode?: InputOTPMode
  /** `boxes` apart, `joined` as one bar, `underline` only a bottom edge, `dotted-mask` hides digits behind dots. */
  variant?: InputOTPVariant
  /** `pop` springs each character in as it lands. */
  effect?: InputOTPEffect
  /** Marks the code wrong: red edge, aria-invalid and a short shake that collapses under reduced motion. */
  error?: boolean
}

function InputOTP({
  length = DEFAULT_LENGTH,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  mode = "numeric",
  variant = "boxes",
  effect,
  error = false,
  className,
  ref,
  ...props
}: InputOTPProps) {
  const reduceMotion = useReducedMotion() ?? false
  const invalid = error || props["aria-invalid"] === true || props["aria-invalid"] === "true"
  const otp = useOtpState({ length, mode, value, defaultValue, onValueChange, onComplete })
  const { inputRef, text, focused, selection } = otp
  const handlers = useOtpHandlers(otp)
  const scope = useShakeOnError(invalid, reduceMotion)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, [inputRef])
  const row = { length, variant, invalid, reduceMotion, focused, text, selection }
  return (
    <motion.div
      ref={scope}
      data-slot="input-otp"
      data-variant={variant}
      data-effect={effect}
      data-error={invalid ? "true" : undefined}
      className={cn("relative inline-flex max-w-full has-disabled:opacity-50", className)}
    >
      <OtpRow {...row} pop={effect === "pop" && !reduceMotion} />
      {/* Sits over the boxes and stays invisible: clicks, long-press paste and autofill all reach the real field. */}
      <input
        {...props}
        {...handlers}
        ref={inputRef}
        type="text"
        value={text}
        maxLength={length}
        inputMode={mode === "numeric" ? "numeric" : "text"}
        autoComplete="one-time-code"
        spellCheck={false}
        aria-invalid={invalid ? true : undefined}
        className="absolute inset-0 size-full cursor-text text-base opacity-0 outline-none disabled:cursor-not-allowed"
      />
    </motion.div>
  )
}

export { InputOTP, type InputOTPProps, type InputOTPVariant, type InputOTPEffect, type InputOTPMode }
