import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { CapsLockHint, Checklist, EdgeMeter, RevealButton, SegmentMeter, type PasswordLabels } from "@/registry/miseui/ui/password-input-parts"
import { DEFAULT_MIN_LENGTH, passwordChecks, scorePassword } from "@/registry/miseui/ui/password-input-strength"
import { cn } from "@/registry/miseui/lib/utils"

type PasswordInputVariant = "plain" | "strength" | "checklist" | "inline"
type PasswordInputEffect = "spring"

const defaultLabels = (requiredLength: number): PasswordLabels => ({
  show: "Show password",
  capsLock: "Caps Lock is on",
  meter: "Password strength",
  scores: ["Weak", "Fair", "Good", "Strong"],
  checks: {
    length: `At least ${requiredLength} characters`,
    case: "Upper and lower case letters",
    number: "A number",
    symbol: "A symbol",
  },
  met: "Met",
  unmet: "Not met yet",
})

const FIELD_CLASS = [
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pl-3 text-base shadow-xs md:text-sm pointer-coarse:h-10",
  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
  "transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
]

type FieldHandlers = Pick<React.ComponentProps<"input">, "onChange" | "onKeyDown" | "onKeyUp" | "onBlur">

/** Caps Lock can only be read from a key event, so the hint appears on the first key press and leaves with focus. */
function useFieldState(defaultValue: React.ComponentProps<"input">["defaultValue"], handlers: FieldHandlers) {
  const [typed, setTyped] = useState(String(defaultValue ?? ""))
  const [capsLock, setCapsLock] = useState(false)
  const events: Required<FieldHandlers> = {
    onChange: (event) => {
      setTyped(event.target.value)
      handlers.onChange?.(event)
    },
    onKeyDown: (event) => {
      setCapsLock(event.getModifierState("CapsLock"))
      handlers.onKeyDown?.(event)
    },
    onKeyUp: (event) => {
      setCapsLock(event.getModifierState("CapsLock"))
      handlers.onKeyUp?.(event)
    },
    onBlur: (event) => {
      setCapsLock(false)
      handlers.onBlur?.(event)
    },
  }
  return { typed, capsLock, events }
}

/** A revealed password would otherwise be offered to the browser's autofill as plain text when the form submits. */
function useReveal() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const hide = () => setRevealed(false)
    form.addEventListener("submit", hide)
    return () => form.removeEventListener("submit", hide)
  }, [])
  return { inputRef, revealed, toggle: () => setRevealed((current) => !current) }
}

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** `plain` field and reveal, `strength` a meter below, `checklist` requirements ticking off, `inline` the meter on the field edge. */
  variant?: PasswordInputVariant
  /** `spring` eases the meter to its new level. */
  effect?: PasswordInputEffect
  /** The length the first check and the strength cap ask for. This is not the HTML attribute. */
  requiredLength?: number
  /** Replaces any wording, for your language. */
  labels?: Partial<PasswordLabels>
}

function PasswordInput({ variant = "plain", effect, requiredLength = DEFAULT_MIN_LENGTH, labels, className, autoComplete, onChange, onKeyDown, onKeyUp, onBlur, ...props }: PasswordInputProps) {
  const { inputRef, revealed, toggle } = useReveal()
  const { typed, capsLock, events } = useFieldState(props.defaultValue, { onChange, onKeyDown, onKeyUp, onBlur })
  const text = props.value !== undefined ? String(props.value) : typed
  const score = scorePassword(text, requiredLength)
  const words = { ...defaultLabels(requiredLength), ...labels }
  const spring = effect === "spring"
  const inline = variant === "inline"
  return (
    <div data-slot="password-input" data-variant={variant} data-effect={effect} className={cn("grid w-full min-w-0 gap-2", className)}>
      <div className="relative min-w-0">
        <input
          ref={inputRef}
          {...props}
          {...events}
          data-slot="password-input-field"
          type={revealed ? "text" : "password"}
          // New-password variants tell the manager to offer a generated one instead of filling an old one in.
          autoComplete={autoComplete ?? (variant === "plain" ? "current-password" : "new-password")}
          autoCapitalize="off"
          autoCorrect="off"
          // Without this, some browsers send a revealed password to a cloud spell checker.
          spellCheck={false}
          className={cn(FIELD_CLASS, inline ? "pr-24" : "pr-9 pointer-coarse:pr-10")}
        />
        {inline && score > 0 ? (
          <span data-slot="password-input-score" className="pointer-events-none absolute inset-y-0 right-10 flex items-center text-[13px] text-muted-foreground">
            {words.scores[score - 1]}
          </span>
        ) : null}
        <RevealButton revealed={revealed} label={words.show} disabled={props.disabled} onToggle={toggle} />
        {inline ? <EdgeMeter score={score} labels={words} spring={spring} /> : null}
      </div>
      {capsLock ? <CapsLockHint text={words.capsLock} /> : null}
      {variant === "strength" ? <SegmentMeter score={score} labels={words} spring={spring} /> : null}
      {variant === "checklist" ? <Checklist checks={passwordChecks(text, requiredLength)} labels={words} /> : null}
    </div>
  )
}

export { PasswordInput, passwordChecks, scorePassword, type PasswordInputProps, type PasswordInputVariant, type PasswordInputEffect, type PasswordLabels }
