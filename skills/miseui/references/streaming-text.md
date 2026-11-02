# Streaming Text

Reveals arriving text character by character at reading speed, with a caret that marks where the next word lands.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/streaming-text.json
```

## Why it looks like this

**Perceived latency.** A reply that starts appearing within the first second feels fast even when the whole answer takes ten. Text that arrives at roughly reading speed is also easier to follow than paragraphs that pop in whole, and the caret shows exactly where to keep reading.

**Don't.** Do not stream text you already have in full; fake typing is a delay dressed up as progress, and people notice. Hand it the growing string from the model, not a finished one.

## Usage

```tsx
import { StreamingText } from "@/components/ui/streaming-text"

// `reply` grows as tokens arrive from the model
<StreamingText text={reply} onDone={() => setStreaming(false)} />
<StreamingText text={reply} speed={90} cursor={false} />
```

Exports: `StreamingText`
