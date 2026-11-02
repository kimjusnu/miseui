# Textarea

Multi-line text field that starts at 64 px and grows with its content, so the answer is never hidden behind a scrollbar.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/textarea.json
```

## Why it looks like this

**Chunking.** People write more when they can see room to write. Textarea opens at 64 px, about three lines, and grows with its content through field-sizing, so a long answer stays fully visible instead of scrolling inside a small box.

**Don't.** Do not use it for single values such as a name or an email, and do not pin the height with rows when the length of the answer is unknown. A field that grows beats one that scrolls.

## Usage

```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="What should the model know about you?" />
```

Exports: `Textarea`
