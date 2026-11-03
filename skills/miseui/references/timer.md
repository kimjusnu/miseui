# Timer

Counts down to a moment or up from one, with pause and resume. It reads the clock instead of adding ticks, so a sleeping tab cannot make it wrong.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/timer.json
```

## Why it looks like this

**Goal gradient effect.** People work faster and stay longer as they see an end getting closer, so a visible remaining time turns waiting into progress. Tabular figures keep the digits from shaking as they change, and a screen reader hears the time once a minute instead of every second.

**Don't.** Do not invent urgency: a countdown that resets on reload is a lie that costs trust once noticed. Do not use it where the time left is unknown or estimated; a progress bar or a spinner tells the truth there.

## Designs

Pass one as the `variant` prop.

- `plain` (Visual hierarchy): When the time is the point of the screen, such as a focus session or an exam page.
- `boxes` (Chunking): For long spans such as a launch or a sale, where days and hours read faster as labelled pieces.
- `compact` (Peripheral awareness): In a table row or a header, for a running job or a held seat, where the time supports something else.
- `ring` (Goal gradient effect): When the share of time gone matters as much as the digits, such as a cooking step or a rest between sets.

## Effects

Pass one as the `effect` prop.

- `roll` (Physical metaphor): On a large clock people will actually watch, where digits turning like a counter wheel make each change readable. Plain under reduced motion.

## Usage

```tsx
import { Timer } from "@/components/ui/timer"

// Counts down for five minutes from now, with pause and reset.
<Timer duration={5 * 60 * 1000} variant="ring" controls onComplete={() => alarm()} />

// Counts down to a fixed moment.
<Timer target={new Date("2027-01-01T00:00:00")} variant="boxes" effect="roll" />

// Counts up from when a job started.
<Timer mode="up" target={job.startedAt} variant="compact" />
```

Exports: `Timer`, `formatClock`, `useTimer`
