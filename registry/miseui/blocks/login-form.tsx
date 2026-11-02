import type * as React from "react"
import { useId, useRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Label } from "@/registry/miseui/ui/label"
import { BrandPanel, InvoiceFragments } from "@/registry/miseui/blocks/login-form-visual"
import {
  EmailField,
  FieldError,
  PasswordField,
  SocialRow,
  useLoginForm,
  type LoginProvider,
  type LoginValues,
} from "@/registry/miseui/blocks/login-form-parts"

const PREVIEW_DELAY_MS = 1200
const DEFAULT_PROVIDERS: readonly LoginProvider[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
]
const LINK_CLASS =
  "rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** Stands in until you pass onSubmit, so the preview shows the loading and error states. Replace it. */
function previewSubmit() {
  return new Promise<void>((_, reject) => {
    window.setTimeout(() => reject(new Error("That password does not match this email.")), PREVIEW_DELAY_MS)
  })
}

interface LoginFormProps extends Omit<React.ComponentProps<"section">, "onSubmit"> {
  /** Called once the fields pass the basic checks. Return a promise to get the loading state; a rejection's message is shown inline. */
  onSubmit?: (values: LoginValues) => void | Promise<void>
  /** An error you already know about, such as a locked account. Shown under the password. */
  error?: string
  /** Forces the loading state, if you track the request yourself. */
  pending?: boolean
  brandName?: string
  /** The one product sentence on the panel. Keep it true; this is no place for a testimonial. */
  tagline?: string
  /** The muted second sentence of the heading. */
  headingNote?: string
  /** Small pieces of your real product for the panel. The default is a sample invoice; null leaves only the sentence. */
  visual?: React.ReactNode
  forgotPasswordHref?: string
  /** Where "Create an account" goes. Null removes the line, for invite-only products. */
  signUpHref?: string | null
  /** Pass an empty list if you only support email. */
  socialProviders?: readonly LoginProvider[]
  onSocial?: (id: string) => void
}

function LoginForm({
  onSubmit = previewSubmit,
  error,
  pending = false,
  brandName = "Paperline",
  tagline = "Invoices that chase themselves, so you do not have to.",
  headingNote = "Your invoices are where you left them.",
  visual = <InvoiceFragments />,
  forgotPasswordHref = "#forgot-password",
  signUpHref = "#sign-up",
  socialProviders = DEFAULT_PROVIDERS,
  onSocial,
  className,
  ...props
}: LoginFormProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const form = useLoginForm(onSubmit, (field) => (field === "email" ? emailRef : passwordRef).current?.focus())
  const busy = pending || form.submitting

  return (
    <section data-slot="login-form" className={cn("@container flex w-full flex-col bg-background", className)} {...props}>
      <div className="grid min-h-[640px] flex-1 grid-cols-1 @3xl:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-12 @3xl:px-12">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <h2 className="text-display text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
              Log in to {brandName}. <span className="text-muted-foreground">{headingNote}</span>
            </h2>
            <div className="flex flex-col gap-6">
              <SocialRow providers={socialProviders} disabled={busy} onSocial={onSocial} />
              <CredentialsForm
                form={form}
                emailRef={emailRef}
                passwordRef={passwordRef}
                busy={busy}
                error={error}
                forgotPasswordHref={forgotPasswordHref}
              />
            </div>
            {signUpHref ? (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                No account yet?{" "}
                <a href={signUpHref} className={cn(LINK_CLASS, "font-medium text-foreground")}>
                  Create an account
                </a>
              </p>
            ) : null}
          </div>
        </div>
        <BrandPanel brandName={brandName} tagline={tagline} visual={visual} />
      </div>
    </section>
  )
}

interface CredentialsFormProps {
  form: ReturnType<typeof useLoginForm>
  emailRef: React.RefObject<HTMLInputElement | null>
  passwordRef: React.RefObject<HTMLInputElement | null>
  busy: boolean
  error?: string
  forgotPasswordHref: string
}

/** Inputs go read-only while busy instead of disabled: disabling would throw away focus and hide the text. */
function CredentialsForm({ form, emailRef, passwordRef, busy, error, forgotPasswordHref }: CredentialsFormProps) {
  const emailId = useId()
  const passwordId = useId()
  const passwordErrorId = `${passwordId}-error`
  const passwordError = form.errors.password ?? form.submitError ?? error

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy) void form.submit()
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <EmailField
        ref={emailRef}
        id={emailId}
        error={form.errors.email}
        readOnly={busy}
        value={form.values.email}
        onChange={(event) => form.change("email", event.target.value)}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <PasswordField
          ref={passwordRef}
          id={passwordId}
          readOnly={busy}
          value={form.values.password}
          onChange={(event) => form.change("password", event.target.value)}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? passwordErrorId : undefined}
        />
        {/* Under the field, not beside its label: there, Tab would land on the link between email and password. */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">{passwordError ? <FieldError id={passwordErrorId}>{passwordError}</FieldError> : null}</div>
          <a href={forgotPasswordHref} className={cn(LINK_CLASS, "shrink-0 text-[13px] text-muted-foreground hover:text-foreground")}>
            Forgot password?
          </a>
        </div>
      </div>
      <Button type="submit" disabled={busy} aria-busy={busy || undefined} className="w-full">
        {busy ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {busy ? "Logging in" : "Log in"}
      </Button>
    </form>
  )
}

export { LoginForm, type LoginFormProps, type LoginProvider, type LoginValues }
