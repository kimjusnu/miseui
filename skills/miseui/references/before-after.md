# Before After

Two versions of one thing in the same frame, compared with a divider you drag or a lens that follows the pointer.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/before-after.json
```

## Why it looks like this

**Change blindness.** People are poor at spotting differences between two pictures placed side by side, because the eye has to jump and remember. Laying them in one frame and moving a line across makes the difference happen in place, and the reader does the comparing themselves, which is more convincing than being told.

**Don't.** Do not use it for two things that do not line up, such as different crops or layouts, where the divider only shows a mess. On a phone the frame takes over the drag, so keep it small enough to scroll past.

## Designs

Pass one as the `variant` prop.

- `split` (Mapping): The default for photos and redesigns: most differences read best across the width, and the page still scrolls under a finger.
- `curtain` (Mapping): For tall subjects or anything layered top to bottom, such as a full page or a map with and without its data.
- `lens` (Focus and context): When the change is in the fine detail, such as sharpening or a retouch: the window follows the pointer with the old version all around it.

## Effects

Pass one as the `effect` prop.

- `sweep` (Signifiers): When the frame could pass for a plain image: the divider moves once when it comes into view, shows it can be moved, and returns without reporting a change.

## Usage

```tsx
import { BeforeAfter } from "@/components/ui/before-after"

<BeforeAfter
  before={<img src="/old.jpg" alt="The old checkout" className="size-full object-cover" />}
  after={<img src="/new.jpg" alt="The new checkout" className="size-full object-cover" />}
  beforeLabel="2024"
  afterLabel="2026"
  effect="sweep"
/>
```

Exports: `BeforeAfter`
