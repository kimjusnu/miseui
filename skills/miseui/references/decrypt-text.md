# Decrypt Text

Text that starts unreadable and is decoded in place, on first view or behind a real button.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/decrypt-text.json
```

## Why it looks like this

**Curiosity gap.** Showing that something is there but not yet readable makes people want the missing part, and the before-state tells them what kind of thing it is: a password, a redacted fact, an encoded message. The letters keep their final width, so decoding never moves the page, and assistive tech only ever gets the real sentence.

**Don't.** This is theatre and not security: the text is in the page from the start, so never put a real secret here without fetching it on press. Keep it to one line per view, and do not use it for content people came to read.

## Designs

Pass one as the `variant` prop.

- `dots` (Mental model): Anything that behaves like a password or a card number: people already know that dots stand for hidden letters.
- `redact` (Figure and ground): A fact withheld and then given, one word at a time: the bars show how long each word is, which is the tease.
- `cipher` (Signal and noise): A technical or playful line in a monospace face: the cipher stays muted and stands still, and each letter locks with a brief mark, so progress is easy to follow.
- `scan` (Common fate): A line that is being checked or read, such as a verified result: one thin line moves and everything behind it is done, wrapped lines together.

## Effects

Pass one as the `effect` prop.

- `press` (User control): When the reader should choose the moment, like a shared wifi password in a settings page: it stays encrypted behind a real button, and keyboard and screen reader users get the same choice.

## Usage

```tsx
import { DecryptText } from "@/components/ui/decrypt-text"

<DecryptText text="Card ending 4242 is verified" />

<DecryptText as="h2" text="The launch moves to March" variant="redact" />

<DecryptText text="Backup restored from last night" variant="cipher" />

<DecryptText text="quiet-harbour-41" variant="dots" effect="press" label="Show password" />
```

Exports: `DecryptText`
