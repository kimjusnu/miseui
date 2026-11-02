# Shimmer Text

A band of light passing over a status label, so “Thinking…” reads as in progress without inventing a percentage.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/shimmer-text.json
```

## Why it looks like this

**Progress without false precision.** A model call has no honest percentage to show, and a bar that fakes one is caught the moment it stalls. A light passing over the label says “still working” with every pass and promises nothing about how long is left. The pause between passes keeps it from reading as a loading bar.

**Don't.** Do not shimmer finished text or body copy; the effect means “not done yet”, so leaving it on contradicts the content. Turn it off the moment the answer starts streaming.

## Usage

```tsx
import { ShimmerText } from "@/components/ui/shimmer-text"

<ShimmerText>Thinking…</ShimmerText>
<ShimmerText duration={3}>Reading 12 files…</ShimmerText>
<ShimmerText active={false}>Done</ShimmerText>
```

Exports: `ShimmerText`
