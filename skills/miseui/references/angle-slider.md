# Angle Slider

A dial for rotation and other circular values: drags one to one under pointer capture, steps by keyboard, wraps past 360, with a ring, a marked compass, a small knob and a 270 degree gauge.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/angle-slider.json
```

## Why it looks like this

**Natural mapping.** An angle is circular, and a straight slider has to invent ends that do not exist. On a dial the control has the same shape as the value, so rotating a thing means turning a thing, and going past the top simply continues.

**Don't.** Do not use it for ordinary numeric ranges with no circular meaning; a straight slider is more precise, and small dials are hard to hit exactly. Offer a number field beside it where exact values matter.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): As the main control of a panel: one ring, one thumb and the value in the middle.
- `ticks` (Recognition over recall): When people aim for known positions, such as a compass heading or a shadow direction.
- `compact` (Information density): In a dense inspector row beside other fields, where the knob shows direction and the number shows the value.
- `gauge` (Natural mapping): For a bounded amount such as volume or intensity. The gap at the bottom says it has two ends, so it does not wrap.

## Effects

Pass one as the `effect` prop.

- `spring` (Continuity): When people click around the dial: the thumb eases to the spot so the eye can follow it. A drag still follows the pointer exactly, because lag there feels broken.

## Usage

```tsx
import { AngleSlider } from "@/components/ui/angle-slider"

<AngleSlider aria-label="Rotation" defaultValue={45} step={5} onValueCommit={save} />

<AngleSlider aria-label="Heading" variant="ticks" effect="spring" marks={[{ value: 0, label: "N" }, { value: 90, label: "E" }]} />

<AngleSlider aria-label="Volume" variant="gauge" max={100} defaultValue={60} format={(value) => `${value}%`} />
```

Exports: `AngleSlider`
