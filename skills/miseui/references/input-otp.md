# Input OTP

One-time code entry drawn as boxes but built on one real input, so SMS autofill, paste, backspace and screen readers all work.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/input-otp.json
```

## Why it looks like this

**Error prevention.** Separate boxes show how long the code is and how much is left, so a missing digit is visible before submitting. Under the boxes is a single real input with the one-time-code hint and a number pad, so the phone can fill the code from a message and a paste lands whole. Backspace walks left across boxes, and arrows move a box at a time.

**Don't.** Do not use it for a password or for free text of unknown length. Do not auto-submit on complete if a wrong code costs the person an attempt; show a button instead.

## Designs

Pass one as the `variant` prop.

- `boxes` (Chunking): Use it as the default on a verification screen, where the separate slots make the length obvious.
- `joined` (Common region): Use it when the code should read as one value, or sits inline with other fields and needs to take less room.
- `underline` (Signal to noise): Use it on a minimal or full-screen step, where the digits are the only thing on the page and boxes would add weight.
- `dotted-mask` (Privacy by default): Use it for a PIN or a payment code on a shared or public screen, where digits should not be read over a shoulder.

## Effects

Pass one as the `effect` prop.

- `pop` (Immediate feedback): Use it where people type by hand and watch the field, so each key press visibly lands.

## Usage

```tsx
import { InputOTP } from "@/components/ui/input-otp"

<InputOTP aria-label="Verification code" onComplete={(code) => verify(code)} />
<InputOTP aria-label="PIN" length={4} variant="dotted-mask" effect="pop" />

// Set error when the server rejects the code; clear it when they type again
<InputOTP aria-label="Verification code" value={code} onValueChange={setCode} error={rejected} />
```

Exports: `InputOTP`
