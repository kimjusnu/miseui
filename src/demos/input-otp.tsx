import type * as React from "react"
import { useState } from "react"
import { InputOTP, type InputOTPVariant } from "@/registry/miseui/ui/input-otp"

const VARIANTS: readonly InputOTPVariant[] = ["boxes", "joined", "underline", "dotted-mask"]
/** A demo needs some code to be the right one; nothing is checked anywhere else. */
const VALID_CODE = "204816"

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function VerifyDemo() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle")
  const wrong = status === "wrong"
  return (
    <div className="grid min-w-0 gap-2">
      <InputOTP
        aria-label="Verification code"
        effect="pop"
        value={value}
        error={wrong}
        onValueChange={(next) => {
          setValue(next)
          setStatus("idle")
        }}
        onComplete={(code) => setStatus(code === VALID_CODE ? "right" : "wrong")}
      />
      <p aria-live="polite" className="text-[13px] text-muted-foreground">
        {status === "idle" ? `Try ${VALID_CODE}, or any other code to see the error.` : null}
        {wrong ? "That code did not match. Check the message and try again." : null}
        {status === "right" ? "Verified." : null}
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid w-full max-w-sm min-w-0 gap-6">
      {VARIANTS.map((variant) => (
        <Labelled key={variant} title={variant}>
          <InputOTP aria-label={`Sign-in code, ${variant}`} variant={variant} defaultValue="48" />
        </Labelled>
      ))}
      <Labelled title="pop effect and error state">
        <VerifyDemo />
      </Labelled>
      <Labelled title="alphanumeric, four characters">
        <InputOTP aria-label="Invite code" mode="alphanumeric" length={4} variant="joined" effect="pop" />
      </Labelled>
    </div>
  )
}
