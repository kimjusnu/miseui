# Beams Background

Straight lines of light behind a section: a fan, lights on a grid, one slow band or soft shafts, quiet enough to keep the sentence on top first.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/beams-background.json
```

## Why it looks like this

**Figure and ground.** A sentence reads first when what sits behind it stays clearly behind it. Slow, low-contrast light gives a section some depth without competing, and every beam is capped so muted text on top stays at 4.5:1 in all palettes.

**Don't.** Do not use it behind long reading or inside a dense dashboard, and do not stack several on one screen: motion in the corner of the eye takes attention from everything else. Give the owner of the page a pause control when it keeps moving.

## Designs

Pass one as the `variant` prop.

- `rays` (Focal point): A hero with one sentence, where a fan from above points the eye down at it.
- `lines` (Common fate): A developer tool or an infrastructure page: lights moving along a faint grid suggest something running without showing data.
- `sweep` (Selective attention): A plain section that needs one slow change and nothing else to look at.
- `columns` (Rhythm): A wide banner, where shafts of different heights break up an empty band without any shape to read.

## Effects

Pass one as the `effect` prop.

- `flow` (Change blindness): The default: slow enough to miss at a glance, and it stops off screen, in a hidden tab and with the paused prop.
- `still` (Attention economy): Many cards on one page, where one finished frame gives the look and nothing moves. Reduced motion gets this frame too.

## Usage

```tsx
import { BeamsBackground } from "@/components/ui/beams-background"

<BeamsBackground variant="rays" paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Deploys that finish before your coffee</h2>
  </section>
</BeamsBackground>

<BeamsBackground variant="lines" effect="still" seed={4} className="h-52" />
```

Exports: `BeamsBackground`
