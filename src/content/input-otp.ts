import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "input-otp",
  title: "Input OTP",
  category: "forms",
  description:
    "One-time code entry drawn as boxes but built on one real input, so SMS autofill, paste, backspace and screen readers all work.",
  why: {
    principle: "Error prevention",
    explanation:
      "Separate boxes show how long the code is and how much is left, so a missing digit is visible before submitting. Under the boxes is a single real input with the one-time-code hint and a number pad, so the phone can fill the code from a message and a paste lands whole. Backspace walks left across boxes, and arrows move a box at a time.",
    avoid:
      "Do not use it for a password or for free text of unknown length. Do not auto-submit on complete if a wrong code costs the person an attempt; show a button instead.",
  },
  designs: [
    {
      name: "boxes",
      principle: "Chunking",
      use: "Use it as the default on a verification screen, where the separate slots make the length obvious.",
    },
    {
      name: "joined",
      principle: "Common region",
      use: "Use it when the code should read as one value, or sits inline with other fields and needs to take less room.",
    },
    {
      name: "underline",
      principle: "Signal to noise",
      use: "Use it on a minimal or full-screen step, where the digits are the only thing on the page and boxes would add weight.",
    },
    {
      name: "dotted-mask",
      principle: "Privacy by default",
      use: "Use it for a PIN or a payment code on a shared or public screen, where digits should not be read over a shoulder.",
    },
  ],
  effects: [
    {
      name: "pop",
      principle: "Immediate feedback",
      use: "Use it where people type by hand and watch the field, so each key press visibly lands.",
    },
  ],
  usage: `import { InputOTP } from "@/components/ui/input-otp"

<InputOTP aria-label="Verification code" onComplete={(code) => verify(code)} />
<InputOTP aria-label="PIN" length={4} variant="dotted-mask" effect="pop" />

// Set error when the server rejects the code; clear it when they type again
<InputOTP aria-label="Verification code" value={code} onValueChange={setCode} error={rejected} />`,
  exports: ["InputOTP"],
}
