# Dock

A row of icon buttons that swell near the pointer and rise without moving the page: a glass bar, bare tiles, a side rail or words under every icon.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/dock.json
```

## Why it looks like this

**Fitts's law.** A target that grows as the pointer approaches is easier to hit, and the swell around the pointer shows which icons are within reach before anyone has to read them. The growth is drawn with transforms inside space the dock reserves, so nothing around it moves.

**Don't.** Do not use icons alone for things people have to guess at; use `labeled`, or a plain sidebar or tabs when there are more than about seven places. A person on a phone never sees the swell or the tooltips, so nothing may depend on them.

## Designs

Pass one as the `variant` prop.

- `glass` (Figure and ground): Floating over a picture, a canvas or a map, where a translucent bar keeps the work visible behind it. It turns solid for people who ask for less transparency.
- `plain` (Law of similarity): On a calm page with no surface to float over, where each item is its own small key and the current one is filled.
- `vertical` (Serial position effect): A side rail beside the work, where a wide screen has height to spare and the first and last items are the easiest to find.
- `labeled` (Recognition over recall): For people who should not have to guess or hover: the word is always there, as on a phone's tab bar.

## Effects

Pass one as the `effect` prop.

- `magnify` (Fitts's law): A short row of places on a device with a pointer. Keyboard focus swells too. A row too long for its box scrolls inside itself and stays at rest, because a scroller would clip the swell.
- `bounce` (Feedback): When pressing an item starts something that takes a moment to appear. Mark those items with `opens`; items that only switch a view stay still.

## Usage

```tsx
import { Dock, DockItem } from "@/components/ui/dock"
import { Files, Home, Inbox } from "lucide-react"

<Dock label="Apps" variant="glass" effect="magnify">
  <DockItem label="Home" href="/" active><Home /></DockItem>
  <DockItem label="Inbox" href="/inbox"><Inbox /></DockItem>
  <DockItem label="Files" opens onClick={openFiles}><Files /></DockItem>
</Dock>
```

Exports: `Dock`, `DockItem`
