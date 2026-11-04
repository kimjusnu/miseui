import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { VerificationInline } from "./verification-code-inline"
import { CodeForm, VerifiedScreen, type CodeFormProps, type VerifiedProps } from "./verification-code-parts"
import { VerificationSplit } from "./verification-code-split"
import { useVerification, WRONG_CODE } from "./verification-code-state"

type VerificationCodeVariant = "card" | "split" | "inline"

const PREVIEW_DELAY_MS = 900
const PREVIEW_CODE = "246810"
const DEFAULT_LENGTH = 6
const DEFAULT_RESEND_SECONDS = 30
const DEFAULT_TIPS: readonly string[] = ["Not there after a minute? Look in spam or promotions.", "Each new code replaces the one before it."]

/** Stands in until you pass onVerify, so the preview reaches the wrong-code and success states. Replace it. */
function previewVerify(code: string) {
  return new Promise<void>((resolve, reject) => {
    window.setTimeout(() => (code === PREVIEW_CODE ? resolve() : reject(new Error(WRONG_CODE))), PREVIEW_DELAY_MS)
  })
}

function previewResend() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, PREVIEW_DELAY_MS)
  })
}

interface VerificationCodeProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** `card` one card on the grey ground, `split` the form beside what to look for in the inbox, `inline` a row inside your own form. Anything else is `card`. */
  variant?: VerificationCodeVariant
  /** Where the code went. It is only repeated back, in words that do not say whether it has an account. */
  destination?: string
  title?: string
  /** The quieter second part of the heading. The default never says the address exists, so this screen cannot be used to test addresses. */
  note?: string
  length?: number
  /** Check the code here. Return a promise to get the checking state. A rejection's message is announced and shown, so keep it about the code. */
  onVerify?: (code: string) => void | Promise<void>
  /** Send another. A rejection's message is announced and shown. */
  onResend?: () => void | Promise<void>
  /** How long before another code may be requested. Long enough for mail to arrive. */
  resendAfterSeconds?: number
  /** An error you already know about, such as too many tries. */
  error?: string
  /** Under the field, for anything true about the code, such as how long it lasts. */
  hint?: string
  /** Puts the caret in the field on arrival. Turn it on when this is the whole screen. */
  autoFocus?: boolean
  verifyLabel?: string
  /** Where "Use a different email" goes. Null removes it. */
  changeHref?: string | null
  changeLabel?: string
  sentNote?: string
  verifiedTitle?: string
  verifiedNote?: string
  continueLabel?: string
  onContinue?: () => void
  /** `split` only: the name and subject on the real message. */
  sender?: string
  subject?: string
  tips?: readonly string[]
}

interface CardProps extends React.ComponentProps<"section"> {
  title: string
  note: string
  form: CodeFormProps
  verified: VerifiedProps
}

function VerificationCard({ title, note, form, verified, className, ...props }: CardProps) {
  return (
    <section data-slot="verification-code" data-variant="card" className={cn("@container flex w-full flex-col bg-muted dark:bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 flex-col items-center justify-center px-4 py-12 @md:px-6">
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-background p-6 @md:p-8 dark:bg-card">
          {form.flow.verified ? (
            <VerifiedScreen {...verified} />
          ) : (
            <>
              <h2 className="text-display text-2xl leading-[1.12]! text-balance wrap-break-word">
                {title} <span className="text-muted-foreground">{note}</span>
              </h2>
              <CodeForm {...form} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function VerificationCode({
  variant,
  destination = "maya@northgate.studio",
  title = "Enter your code.",
  note,
  length = DEFAULT_LENGTH,
  onVerify = previewVerify,
  onResend = previewResend,
  resendAfterSeconds = DEFAULT_RESEND_SECONDS,
  error,
  hint,
  autoFocus,
  verifyLabel = "Verify",
  changeHref = "#change-email",
  changeLabel = "Use a different email",
  sentNote = "A new code is on its way, if this address has an account.",
  verifiedTitle = "Code accepted.",
  verifiedNote = "You can carry on.",
  continueLabel = "Continue",
  onContinue,
  sender = "Paperline",
  subject = "Your Paperline code",
  tips = DEFAULT_TIPS,
  ...props
}: VerificationCodeProps) {
  const flow = useVerification({ length, onVerify, onResend, resendAfterSeconds, error })
  const quiet = note ?? `If ${destination} has an account, a ${length}-digit code is on its way.`
  const form = { flow, label: "Verification code", length, hint, autoFocus, verifyLabel, changeHref, changeLabel, sentNote }
  const verified = { title: verifiedTitle, note: verifiedNote, continueLabel, onContinue }
  if (variant === "split") return <VerificationSplit title={title} note={quiet} form={form} verified={verified} sender={sender} subject={subject} tips={tips} {...props} />
  if (variant === "inline") return <VerificationInline flow={flow} label={title} note={quiet} length={length} hint={hint} autoFocus={autoFocus} sentNote={sentNote} verifiedTitle={verifiedTitle} {...props} />
  return <VerificationCard title={title} note={quiet} form={form} verified={verified} {...props} />
}

export { VerificationCode, type VerificationCodeProps, type VerificationCodeVariant }
