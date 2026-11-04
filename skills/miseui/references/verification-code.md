# Verification Code

A one-time code screen with a resend countdown, wrong-code and success states, in wording that never reveals whether an address exists: one card, beside what to look for in the inbox, or a row inside your own form.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/verification-code.json
```

## Why it looks like this

**Error recovery.** A code is the one moment a person has to leave your product and come back, so most failures here are small and fixable: a typo, an old code, a message in spam. A wrong code clears itself, says so to a screen reader and puts the caret back. The countdown says when another can be sent, so nobody presses a dead button or floods their own inbox.

**Don't.** Do not use it when a magic link would do, since a link asks less of someone on a phone. Keep your own error messages about the code: "no account with that address" tells anyone who tries which addresses are real.

## Designs

Pass one as the `variant` prop.

- `card` (Single focus): A step in sign-in or sign-up where the code is the only thing to do. Pass autoFocus when it is the whole screen.
- `split` (Recognition over recall): Your mail is easy to miss, or the stakes are high enough that people will hunt for it. A sketch of the message shows them what to look for before they leave.
- `inline` (Stay in context): Confirming a change inside a settings row or a checkout, where sending someone to another screen would lose their place.

## Usage

```tsx
import { VerificationCode } from "@/components/verification-code"

// A rejection shows its message, so keep it about the code and never about the account.
<VerificationCode
  destination={email}
  autoFocus
  onVerify={(code) => api.verify(code)}
  onResend={() => api.sendCode()}
  onContinue={openApp}
/>

// Show what the real message looks like.
<VerificationCode variant="split" sender="Paperline" subject="Your Paperline code" onVerify={verify} onResend={resend} />

// A row inside your own form. The last digit submits.
<VerificationCode variant="inline" title="Confirm your new email" onVerify={verify} onResend={resend} />
```

Exports: `VerificationCode`
