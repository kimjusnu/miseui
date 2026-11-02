# Toast

A brief message about something that just happened, which waits while you read it and leaves without being asked.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/toast.json
```

## Why it looks like this

**Visibility of system status.** People need to know an action worked without being pulled out of what they were doing. A toast confirms it at the edge of the screen and leaves by itself, and the timer stops under the pointer or keyboard focus so nobody loses a message while reading it.

**Don't.** Do not put anything in a toast that people must not miss, or a decision they have to make; use a dialog. Do not confirm what is already visible, such as a toggle that has moved. Errors in a form belong next to the field.

## Designs

Pass one as the `variant` prop.

- `stack` (Progressive disclosure): In busy applications where several things can finish at once: a compact deck that shows them all when the pointer arrives.
- `list` (Serial position effect): When each message matters equally and people should be able to read them all without touching anything.
- `pill` (Signal to noise): For one-word confirmations such as Copied or Saved, one at a time and centred where the eye already is.
- `bar` (Selective attention): For conditions that affect the whole page, such as lost connection or read-only mode, where a colour band at the edge is hard to miss.

## Effects

Pass one as the `effect` prop.

- `spring` (Direct manipulation): On touch screens and pointer-heavy apps: toasts arrive on a spring and a flick carries one off the screen, judged by where the throw was going.

## Usage

```tsx
import { Toaster, toast } from "@/components/ui/toast"

// Once, near the root of the app.
<Toaster variant="stack" effect="spring" position="bottom-right" />

toast("Draft saved")
toast.success("Invoice sent", { description: "finance@northwind.example" })
toast.error("Payment failed", { action: { label: "Retry", onClick: retry } })
toast.promise(upload(file), {
  loading: "Uploading report.pdf",
  success: "Report uploaded",
  error: "Upload failed",
})
```

Exports: `Toaster`, `toast`, `toastStore`, `resolveSwipe`, `deckPlacement`
