import type * as React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

interface LoginValues {
  email: string
  password: string
}

interface LoginProvider {
  id: string
  label: string
}

interface FieldErrors {
  email?: string
  password?: string
}

const EMAIL_SHAPE = /^\S+@\S+$/
const FIELD_ERROR_START = { opacity: 0, y: -4 }
const FIELD_ERROR_END = { opacity: 1, y: 0 }
const SUBMIT_FAILED = "Could not log in. Check your connection and try again."

function validate({ email, password }: LoginValues): FieldErrors {
  const trimmed = email.trim()
  const emailError = !trimmed
    ? "Enter your email address."
    : EMAIL_SHAPE.test(trimmed)
      ? undefined
      : "That email looks incomplete. Check the @ and what follows it."
  return { email: emailError, password: password ? undefined : "Enter your password." }
}

function useLoginForm(
  onSubmit: (values: LoginValues) => void | Promise<void>,
  focusField: (field: keyof LoginValues) => void,
) {
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const change = (field: keyof LoginValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(undefined)
  }

  const submit = async () => {
    const found = validate(values)
    setErrors(found)
    setSubmitError(undefined)
    if (found.email) return focusField("email")
    if (found.password) return focusField("password")
    setSubmitting(true)
    try {
      await onSubmit({ ...values, email: values.email.trim() })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : SUBMIT_FAILED)
      focusField("password")
    } finally {
      setSubmitting(false)
    }
  }

  return { values, errors, submitError, submitting, change, submit }
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.p
      id={id}
      role="alert"
      className="text-[13px] leading-snug text-pretty text-destructive"
      initial={reduceMotion ? false : FIELD_ERROR_START}
      animate={FIELD_ERROR_END}
      transition={SPRING_DEFAULT}
    >
      {children}
    </motion.p>
  )
}

interface EmailFieldProps extends Omit<React.ComponentProps<typeof Input>, "type" | "id"> {
  id: string
  error?: string
}

function EmailField({ id, error, ...props }: EmailFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        id={id}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

interface PasswordFieldProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  id: string
}

/** Seeing what was typed beats retyping it blind: the toggle swaps the type and leaves the value and the caret alone. */
function PasswordField({ id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} autoComplete="current-password" className="pr-12" {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 text-muted-foreground"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

interface SocialRowProps {
  providers: readonly LoginProvider[]
  disabled: boolean
  onSocial?: (id: string) => void
}

function SocialRow({ providers, disabled, onSocial }: SocialRowProps) {
  if (providers.length === 0) return null
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`Continue with ${provider.label}`}
            onClick={() => onSocial?.(provider.id)}
            className="min-w-0 flex-1"
          >
            {provider.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        or with email
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}

export {
  EmailField,
  FieldError,
  PasswordField,
  SocialRow,
  useLoginForm,
  type LoginProvider,
  type LoginValues,
}
