# Meteors Background

Short streaks crossing a section: thin meteors, faint rain, slow comets or a twinkling sky, placed from a seed and moved with transforms only.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/meteors-background.json
```

## Why it looks like this

**Peripheral vision.** The edge of the eye picks up movement before anything else, so a rare streak makes a section feel alive while the reader keeps looking at the words. Empty sky between the streaks does the work, which is why every variant has a ceiling on its count.

**Don't.** Do not use it next to live data or an error log: a stream of streaks can read as a stream of failures. Do not use it behind body text, and skip it on a page that already has another moving background.

## Designs

Pass one as the `variant` prop.

- `meteors` (Peripheral vision): A launch or event page, where a thin diagonal now and then adds a little occasion.
- `rain` (Texture gradient): A wide dark section that should feel busy and calm at once. It is denser and much fainter, so it reads as texture.
- `comets` (Von Restorff effect): A hero with space around the headline. Few, slow and long, so each one is noticed once.
- `stars` (Change blindness): A sign-in or a closing section: mostly still points that twinkle slowly, with one streak every so often.

## Effects

Pass one as the `effect` prop.

- `flow` (Attention economy): The default: moves only while on screen, in a visible tab and not paused.
- `still` (Attention economy): A place where the sky should be there and nothing should move. Reduced motion gets this frame too.

## Usage

```tsx
import { MeteorsBackground } from "@/components/ui/meteors-background"

<MeteorsBackground variant="comets" count={3} paused={paused} className="rounded-xl border">
  <section className="grid place-items-center p-12">
    <h2>Launch night, Thursday at nine</h2>
  </section>
</MeteorsBackground>

<MeteorsBackground variant="stars" seed={7} className="h-52" />
```

Exports: `MeteorsBackground`
