import type * as React from "react"
import { useEffect, useId, useRef } from "react"
import { Check, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { InputOTP, type InputOTPVariant } from "@/registry/miseui/ui/input-otp"
import type { Verification } from "./verification-code-state"

const MARK_START = { opacity: 0, scale: 0.6 }
const MARK_END = { opacity: 1, scale: 1 }

interface VerificationCopy {
  length: number
  /** Under the field, for anything true about the code: how long it lasts, or the example code in a preview. */
  hint?: string
  autoFocus?: boolean
}

interface CodeFieldProps extends VerificationCopy {
  flow: Verification
  label: string
  otpVariant?: InputOTPVariant
  /** For a label placed outside the field, such as in a row. */
  labelHidden?: boolean
}

/** The field and everything said about it. The error is role alert, so a screen reader hears it without leaving the field. */
function CodeField({ flow, label, length, hint, autoFocus, otpVariant = "boxes", labelHidden }: CodeFieldProps) {
  const fieldId = useId()
  const errorId = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  // The field was disabled during the check and lost focus. After a wrong code it is the next thing to use.
  useEffect(() => {
    if (flow.error) fieldRef.current?.focus()
  }, [flow.error])
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={fieldId} className={labelHidden ? "sr-only" : "text-[13px] leading-5 font-medium"}>
        {label}
      </label>
      <InputOTP
        ref={fieldRef}
        id={fieldId}
        aria-describedby={flow.error ? errorId : undefined}
        length={length}
        variant={otpVariant}
        value={flow.code}
        error={Boolean(flow.error)}
        disabled={flow.checking}
        autoFocus={autoFocus}
        onValueChange={flow.change}
        onComplete={(value) => void flow.verify(value)}
        className="flex w-full"
      />
      {flow.error ? (
        <p id={errorId} role="alert" className="text-[13px] leading-snug text-pretty text-destructive">
          {flow.error}
        </p>
      ) : null}
      {hint ? <p className="text-[13px] leading-snug text-pretty text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** aria-disabled and not disabled: pressing this starts the wait, and a disabled button would drop keyboard focus. */
function ResendButton({ flow, className }: { flow: Verification; className?: string }) {
  const waiting = flow.secondsLeft > 0 || flow.sending
  return (
    <Button
      type="button"
      variant="ghost"
      aria-disabled={waiting || undefined}
      aria-busy={flow.sending || undefined}
      onClick={() => void flow.resend()}
      className={cn("tabular-nums pointer-coarse:h-10", waiting && "text-muted-foreground hover:bg-transparent hover:text-muted-foreground", className)}
    >
      {flow.sending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
      {flow.secondsLeft > 0 ? `Send a new code in ${flow.secondsLeft}s` : "Send a new code"}
    </Button>
  )
}

/** Always mounted, so the live region exists before there is anything to say. The countdown itself stays out of it. */
function ResendNote({ flow, sentNote }: { flow: Verification; sentNote: string }) {
  return (
    <>
      <p role="status" className="text-[13px] leading-5 text-pretty text-muted-foreground empty:sr-only">
        {flow.sent ? sentNote : ""}
      </p>
      {flow.resendError ? (
        <p role="alert" className="text-[13px] leading-snug text-pretty text-destructive">
          {flow.resendError}
        </p>
      ) : null}
    </>
  )
}

interface CodeFormProps extends VerificationCopy {
  flow: Verification
  label: string
  verifyLabel: string
  changeHref: string | null
  changeLabel: string
  sentNote: string
}

function CodeForm({ flow, label, length, hint, autoFocus, verifyLabel, changeHref, changeLabel, sentNote }: CodeFormProps) {
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void flow.verify(flow.code)
  }
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <CodeField flow={flow} label={label} length={length} hint={hint} autoFocus={autoFocus} />
      <Button type="submit" variant="mise" aria-busy={flow.checking || undefined} disabled={flow.checking} className="w-full pointer-coarse:h-10">
        {flow.checking ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {flow.checking ? "Checking the code" : verifyLabel}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <ResendButton flow={flow} className="-mx-3" />
        {changeHref ? (
          <Button asChild variant="ghost" className="-mx-3 text-muted-foreground pointer-coarse:h-10">
            <a href={changeHref}>{changeLabel}</a>
          </Button>
        ) : null}
      </div>
      <ResendNote flow={flow} sentNote={sentNote} />
    </form>
  )
}

/** Emerald and not the accent: this is a result, and the accent may itself be red. */
function VerifiedMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.span
      data-testid="verified-mark"
      className={cn("grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", className)}
      initial={reduceMotion ? false : MARK_START}
      animate={MARK_END}
      transition={SPRING_DEFAULT}
    >
      <Check aria-hidden="true" className="size-6" />
    </motion.span>
  )
}

interface VerifiedProps {
  title: string
  note: string
  continueLabel: string
  onContinue?: () => void
}

function VerifiedScreen({ title, note, continueLabel, onContinue }: VerifiedProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The form has just gone, so this takes focus: a screen reader hears the result instead of silence.
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="flex flex-col items-start gap-6">
      <VerifiedMark />
      <h2 ref={headingRef} tabIndex={-1} className="text-display text-3xl leading-[1.12]! text-balance outline-none">
        {title} <span className="text-muted-foreground">{note}</span>
      </h2>
      <Button variant="mise" onClick={onContinue} className="w-full pointer-coarse:h-10">
        {continueLabel}
      </Button>
    </div>
  )
}

export { CodeField, CodeForm, ResendButton, ResendNote, VerifiedMark, VerifiedScreen, type CodeFormProps, type VerifiedProps, type VerificationCopy }
