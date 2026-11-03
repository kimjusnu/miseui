# Mask Input

Formats dates, phone numbers, cards and your own patterns as you type. The caret stays put in the middle and on paste, and deleting across a dash works.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/mask-input.json
```

## Why it looks like this

**Error prevention.** A field that shapes the value as it is typed removes a whole class of mistakes before anyone can submit them, and grouping digits into chunks makes long numbers easier to check by eye. People do not have to guess the format; the field shows it.

**Don't.** Do not mask what varies between people, such as names or international phone numbers, where a mask rejects real answers. A mask checks shape, not truth: 99/99/2026 fits a date mask, so still validate the value.

## Designs

Pass one as the `variant` prop.

- `plain` (Consistency): Inside a regular form, where it should look like every other text field beside it.
- `grouped` (Chunking): For long numbers read in pieces, such as a card or an account number, with one box per group.
- `compact` (Fit to content): In a table cell or a filter row, where the field is exactly as wide as what it holds.
- `otp-like` (Recognition over recall): For short codes typed from another screen, where one box per character makes a missing character obvious.

## Usage

```tsx
import { MaskInput } from "@/components/ui/mask-input"

<MaskInput
  mask="card"
  variant="grouped"
  aria-label="Card number"
  name="card"
  onValueChange={(raw, masked) => setCard({ raw, masked })}
  onComplete={(raw) => check(raw)}
/>

// Your own pattern and tokens: # digit, A letter in capitals, a letter, * either, \\ escapes
<MaskInput mask="AA-####" aria-label="Plate" />
<MaskInput mask="hh:hh" tokens={{ h: { test: (c) => /^[0-9a-f]$/i.test(c) } }} aria-label="Bytes" />
```

Exports: `MaskInput`
