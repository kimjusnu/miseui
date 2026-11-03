# Particles Background

Points on one canvas behind a section: floating, joined by faint lines, rising, or an even field with a clearing that follows the pointer.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/particles-background.json
```

## Why it looks like this

**Law of common fate.** Points moving together read as one soft surface instead of many things to look at. One canvas holds them, the count follows the area with a ceiling, and the loop stops off screen, so a busy-looking background stays cheap and out of the way.

**Don't.** Do not use it to suggest data that is not there, and do not put it behind long reading. A constellation behind a network product is on topic; behind a pricing table it is noise.

## Designs

Pass one as the `variant` prop.

- `drift` (Figure and ground): A plain section that needs a little depth and nothing to read.
- `constellation` (Law of connectedness): A product about networks, teams or links, where the lines say what the product does.
- `rise` (Direction of motion): A closing section or a success page, since things going up and fading feel light and finished.
- `field` (Figure and ground): A hero with one sentence: at rest the dots leave a clearing behind it, and the clearing follows the pointer. It costs nothing while it rests.

## Effects

Pass one as the `effect` prop.

- `pointer` (Direct manipulation): Where a pointer is likely to rest on the section: drift points part around it and the constellation links to it. Off on touch; rise ignores it; field does this without the prop.

## Usage

```tsx
import { ParticlesBackground } from "@/components/ui/particles-background"

<ParticlesBackground variant="field" paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Every team on one map</h2>
  </section>
</ParticlesBackground>

<ParticlesBackground variant="constellation" effect="pointer" seed={3} className="h-52" />
```

Exports: `ParticlesBackground`
