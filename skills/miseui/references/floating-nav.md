# Floating Nav

Navigation that floats over the page: a pill with a sliding highlight, a capsule that opens into a panel, a bar that shrinks on scroll or a bottom tab bar.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/floating-nav.json
```

## Why it looks like this

**Visibility of system status.** On a long page people still need to know where they are and how to leave. A floating nav keeps that answer on screen while taking almost nothing from the content, and it holds its place in the layout, so the page under it never jumps.

**Don't.** Do not float a nav over a short page, where a plain header from navigation-menu is calmer and always in reach. Large sets of places belong in sidebar. Keep `tabs` for phones and for three to five places, because more columns shrink past what a thumb can hit.

## Designs

Pass one as the `variant` prop.

- `pill` (Common fate): A marketing page or a long read with a handful of places: one highlight slides between them, so the eye follows the change.
- `island` (Progressive disclosure): When the page needs almost all of the screen: the capsule only says where you are, and the rest opens on request.
- `bar` (Aesthetic-usability effect): A product or brand site that needs a full header at the top and less of it after that, with room for a logo and an action.
- `tabs` (Fitts's law): A phone app or a mobile view, where the bottom of the screen is the part a thumb reaches without moving the hand.

## Effects

Pass one as the `effect` prop.

- `hide` (Figure and ground): Long reading on a small screen: it leaves as people read on, and returns the moment they scroll up, reach the top or Tab into it. The space it held stays, so nothing shifts.

## Usage

```tsx
import { FloatingNav } from "@/components/ui/floating-nav"

const items = [
  { value: "home", label: "Home", href: "/" },
  { value: "notes", label: "Notes", href: "/notes" },
  { value: "about", label: "About", href: "/about" },
]

<FloatingNav label="Main" items={items} value={pathKey} variant="pill" effect="hide" />

// Inside a small scroller instead of the window
<div ref={scrollerRef} className="h-96 overflow-y-auto">
  <FloatingNav label="Main" items={items} variant="bar" position="sticky" scrollContainer={scrollerRef} brand={<Logo />} />
</div>
```

Exports: `FloatingNav`
