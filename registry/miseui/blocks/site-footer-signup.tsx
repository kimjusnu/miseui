import type * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"
import { DEFAULT_BRAND, DEFAULT_COLUMNS, DEFAULT_LEGAL, FooterColumns, INNER_CLASS, LegalRow, ROOT_CLASS, type SiteFooterColumn, type SiteFooterLink, type SiteFooterSharedProps } from "./site-footer-parts"

const PREVIEW_DELAY_MS = 600
const INVALID_MESSAGE = "Enter an email address, such as name@example.com."
const FAILED_MESSAGE = "That did not go through. Your address is still here, so try again."

/** Catches typos, not fake addresses: only a confirmation email can prove one is real. */
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Stands in until you pass onSubscribe, so the preview reaches the done state. Replace it. */
function previewSubscribe() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, PREVIEW_DELAY_MS)
  })
}

type SubscribeHandler = (email: string) => void | Promise<void>

function useSignup(onSubscribe: SubscribeHandler) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const change = (next: string) => {
    setEmail(next)
    setError(null)
  }
  /** Resolves to whether the address was taken, so the form knows where focus belongs. */
  const submit = async () => {
    const value = email.trim()
    if (!looksLikeEmail(value)) {
      setError(INVALID_MESSAGE)
      return false
    }
    setError(null)
    setSending(true)
    try {
      await onSubscribe(value)
      setDoneFor(value)
      return true
    } catch {
      // A fixed sentence: a raw network error says nothing useful in a footer.
      setError(FAILED_MESSAGE)
      return false
    } finally {
      setSending(false)
    }
  }
  return { email, error, sending, doneFor, change, submit }
}

function SignupDone({ email, doneMessage }: { email: string; doneMessage: (email: string) => React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null)
  // The form the person was in has just gone, and focus would fall back to the top of the page with it.
  useEffect(() => ref.current?.focus(), [])
  return (
    <p ref={ref} tabIndex={-1} role="status" data-slot="site-footer-done" className="flex min-w-0 items-start gap-2 text-[15px] leading-relaxed text-pretty [overflow-wrap:anywhere] outline-none">
      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>{doneMessage(email)}</span>
    </p>
  )
}

interface SignupFormProps {
  onSubscribe: SubscribeHandler
  note: string
  doneMessage: (email: string) => React.ReactNode
}

function SignupForm({ onSubscribe, note, doneMessage }: SignupFormProps) {
  const fieldId = useId()
  const messageId = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  const signup = useSignup(onSubscribe)
  if (signup.doneFor !== null) return <SignupDone email={signup.doneFor} doneMessage={doneMessage} />
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signup.sending) return
    if (!(await signup.submit())) fieldRef.current?.focus()
  }
  return (
    <form noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={fieldId} className="sr-only">
        Email address
      </Label>
      <div className="flex flex-col gap-2 @md:flex-row">
        <Input
          ref={fieldRef}
          id={fieldId}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={signup.email}
          readOnly={signup.sending}
          aria-invalid={signup.error ? true : undefined}
          aria-describedby={messageId}
          onChange={(event) => signup.change(event.target.value)}
          className="h-10 @md:flex-1"
        />
        {/* Not disabled: a disabled button drops keyboard focus for the whole send. */}
        <Button type="submit" variant="mise" aria-disabled={signup.sending || undefined} aria-busy={signup.sending || undefined} className="h-10">
          {signup.sending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {signup.sending ? "Subscribing" : "Subscribe"}
        </Button>
      </div>
      {/* One line for both, so an error takes the place of the note and nothing below moves. */}
      <p id={messageId} role={signup.error ? "alert" : undefined} className={cn("text-[13px] leading-5 text-pretty", signup.error ? "text-destructive" : "text-muted-foreground")}>
        {signup.error ?? note}
      </p>
    </form>
  )
}

interface SiteFooterSignupOptions {
  /** Save the address here. Return a promise to get the sending state; a rejection offers another try. */
  onSubscribe?: SubscribeHandler
  signupTitle?: string
  /** Continues the title in the same size, one tone quieter. */
  signupQuiet?: string
  /** Under the field. Say how often you really write. */
  signupNote?: string
  /** What replaces the form when it worked. */
  doneMessage?: (email: string) => React.ReactNode
}

interface SiteFooterSignupProps extends SiteFooterSharedProps, SiteFooterSignupOptions {
  columns?: readonly SiteFooterColumn[]
  legal?: readonly SiteFooterLink[]
}

const defaultDoneMessage = (email: string) => `You are on the list. We will write to ${email}.`

function SiteFooterSignup({
  brand = DEFAULT_BRAND,
  copyright,
  columns = DEFAULT_COLUMNS,
  legal = DEFAULT_LEGAL,
  onSubscribe = previewSubscribe,
  signupTitle = "One useful email a month.",
  signupQuiet = "What changed, and nothing else.",
  signupNote = "Unsubscribe from any email, with one click.",
  doneMessage = defaultDoneMessage,
  className,
  ...props
}: SiteFooterSignupProps) {
  return (
    <footer data-slot="site-footer" data-variant="signup" className={cn(ROOT_CLASS, "bg-muted dark:bg-background", className)} {...props}>
      <div className={cn(INNER_CLASS, "flex flex-col gap-12 py-12")}>
        <div data-slot="site-footer-signup" className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 rounded-2xl border bg-background p-6 dark:bg-card @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:gap-12 @3xl:p-8">
          <h2 className="text-title text-2xl text-balance">
            {signupTitle} <span className="text-muted-foreground">{signupQuiet}</span>
          </h2>
          <SignupForm onSubscribe={onSubscribe} note={signupNote} doneMessage={doneMessage} />
        </div>
        <FooterColumns columns={columns} />
        <LegalRow brand={brand} copyright={copyright} legal={legal} />
      </div>
    </footer>
  )
}

export { SiteFooterSignup, looksLikeEmail, type SiteFooterSignupOptions }
