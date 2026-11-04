import type * as React from "react"
import { useId, useRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Label } from "@/registry/miseui/ui/label"
import {
  EmailField,
  FieldError,
  PasswordField,
  SocialRow,
  useLoginForm,
  type LoginProvider,
  type LoginValues,
} from "./login-form-parts"

const LINK_CLASS =
  "rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"

function SignUpLine({ href }: { href: string | null }) {
  if (!href) return null
  return (
    <p className="text-[13px] leading-relaxed text-muted-foreground">
      No account yet?{" "}
      <a href={href} className={cn(LINK_CLASS, "font-medium text-foreground")}>
        Create an account
      </a>
    </p>
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

interface LoginFieldsProps {
  onSubmit: (values: LoginValues) => void | Promise<void>
  error?: string
  pending: boolean
  forgotPasswordHref: string
  socialProviders: readonly LoginProvider[]
  onSocial?: (id: string) => void
}

/** Social row and password form, the part `split` and `centered` share. Only what is around them differs. */
function LoginFields({ onSubmit, error, pending, forgotPasswordHref, socialProviders, onSocial }: LoginFieldsProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const form = useLoginForm(onSubmit, (field) => (field === "email" ? emailRef : passwordRef).current?.focus())
  const busy = pending || form.submitting
  return (
    <div className="flex flex-col gap-6">
      <SocialRow providers={socialProviders} disabled={busy} onSocial={onSocial} />
      <CredentialsForm form={form} emailRef={emailRef} passwordRef={passwordRef} busy={busy} error={error} forgotPasswordHref={forgotPasswordHref} />
    </div>
  )
}

export { LINK_CLASS, LoginFields, SignUpLine, type LoginFieldsProps }
