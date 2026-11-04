import type * as React from "react"
import { useEffect, useId, useRef } from "react"
import { Loader2, Mail } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { SignUpLine } from "./login-form-credentials"
import { useMagicLink, type MagicLink } from "./login-form-magic-state"
import { EmailField, SocialRow, type LoginProvider } from "./login-form-parts"

const PREVIEW_DELAY_MS = 900
const DEFAULT_RESEND_SECONDS = 30
const NO_PROVIDERS: readonly LoginProvider[] = []
const MARK_START = { opacity: 0, scale: 0.6 }
const MARK_END = { opacity: 1, scale: 1 }

/** Stands in until you pass onSendLink, so the preview reaches the inbox screen. Replace it. */
function previewSend() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, PREVIEW_DELAY_MS)
  })
}

interface LoginMagicProps {
  /** Send the link here. Return a promise to get the loading state; a rejection's message is shown inline. */
  onSendLink?: (email: string) => void | Promise<void>
  /** How long before another link may be requested. Long enough for mail to arrive, so the button does not invite duplicates. */
  resendAfterSeconds?: number
  /** Under the address on the inbox screen. Say how long your link really lasts. */
  sentNote?: string
}

function RequestForm({ link, pending, error }: { link: MagicLink; pending: boolean; error?: string }) {
  const fieldId = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  const busy = pending || link.sending
  // Back from the inbox screen: this form has just replaced the button they pressed, and focus would fall to the page.
  useEffect(() => {
    if (link.cameBack) fieldRef.current?.focus()
  }, [link.cameBack])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    if (!(await link.submit())) fieldRef.current?.focus()
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <EmailField
        ref={fieldRef}
        id={fieldId}
        error={link.fieldError ?? link.sendError ?? error}
        readOnly={busy}
        value={link.email}
        placeholder="maya@northgate.studio"
        onChange={(event) => link.change(event.target.value)}
        className="pointer-coarse:h-10"
      />
      <Button type="submit" disabled={busy} aria-busy={busy || undefined} className="w-full pointer-coarse:h-10">
        {busy ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {busy ? "Sending the link" : "Email me a link"}
      </Button>
    </form>
  )
}

function InboxScreen({ link, note }: { link: MagicLink; note: string }) {
  const reduceMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Takes focus so a screen reader hears the result instead of silence after the form disappears.
  useEffect(() => headingRef.current?.focus(), [])
  const waiting = link.secondsLeft > 0
  return (
    <div className="flex flex-col items-start gap-6">
      <motion.span
        data-testid="inbox-mark"
        className="grid size-12 place-items-center rounded-full bg-muted"
        initial={reduceMotion ? false : MARK_START}
        animate={MARK_END}
        transition={SPRING_DEFAULT}
      >
        <Mail aria-hidden="true" className="size-6" />
      </motion.span>
      <h2 ref={headingRef} tabIndex={-1} className="text-display text-3xl leading-[1.12]! text-balance break-words outline-none @2xl:text-4xl">
        Check your inbox. <span className="text-muted-foreground">We sent a link to {link.sentTo}.</span>
      </h2>
      <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">{note}</p>
      {link.sendError ? (
        <p role="alert" className="text-[13px] leading-snug text-pretty text-destructive">
          {link.sendError}
        </p>
      ) : null}
      <div className="flex w-full flex-col gap-2">
        <Button variant="outline" disabled={waiting || link.sending} aria-busy={link.sending || undefined} onClick={() => void link.resend()} className="w-full tabular-nums pointer-coarse:h-10">
          {link.sending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {waiting ? `Send again in ${link.secondsLeft}s` : "Send again"}
        </Button>
        <Button variant="ghost" onClick={link.startOver} className="w-full pointer-coarse:h-10">
          Use a different email
        </Button>
      </div>
      <p role="status" className="min-h-5 text-[13px] leading-5 text-muted-foreground">
        {link.resent ? "Another link is on its way." : ""}
      </p>
    </div>
  )
}

interface LoginFormMagicProps extends Omit<React.ComponentProps<"section">, "onSubmit">, LoginMagicProps {
  error?: string
  pending?: boolean
  brandName?: string
  headingNote?: string
  signUpHref?: string | null
  socialProviders?: readonly LoginProvider[]
  onSocial?: (id: string) => void
}

/** No card and no panel: with one field left, the sentence and the field are the whole design. */
function LoginFormMagic({
  onSendLink = previewSend,
  resendAfterSeconds = DEFAULT_RESEND_SECONDS,
  sentNote = "It works for 15 minutes. Not there? Look in spam.",
  error,
  pending = false,
  brandName = "Paperline",
  headingNote = "No password to remember.",
  signUpHref = null,
  socialProviders = NO_PROVIDERS,
  onSocial,
  className,
  ...props
}: LoginFormMagicProps) {
  const link = useMagicLink(onSendLink, resendAfterSeconds)
  return (
    <section data-slot="login-form" data-variant="magic" className={cn("@container flex w-full flex-col bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {link.sentTo === null ? (
            <>
              <h2 className="text-display text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
                Log in to {brandName}. <span className="text-muted-foreground">{headingNote}</span>
              </h2>
              <div className="flex flex-col gap-6">
                <SocialRow providers={socialProviders} disabled={pending || link.sending} onSocial={onSocial} />
                <RequestForm link={link} pending={pending} error={error} />
              </div>
              {signUpHref ? <SignUpLine href={signUpHref} /> : <p className="text-[13px] leading-relaxed text-muted-foreground">New here? The same link creates your account.</p>}
            </>
          ) : (
            <InboxScreen link={link} note={sentNote} />
          )}
        </div>
      </div>
    </section>
  )
}

export { LoginFormMagic, type LoginMagicProps }
