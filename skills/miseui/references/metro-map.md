# Metro Map

Lines and stations from data, for a path that branches and meets again: tap a station, walk with the arrow keys.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/metro-map.json
```

## Why it looks like this

**Spatial memory.** People remember where something is more easily than what it is called, and a transit map is a shape nearly everyone already knows how to read. Parallel tracks show what runs at the same time, and a shared station shows where they meet, which a flat list of steps cannot say.

**Don't.** Do not use it for a straight sequence, where Steps or Timeline say the same with less. Stops are evenly spaced on purpose, so do not read distance from it, and do not use it where exact dates matter.

## Designs

Pass one as the `variant` prop.

- `transit` (Familiarity): As the main picture of a page: rings and 45 degree bends, reading left to right and scrolling inside itself on a phone.
- `tube` (Signal to noise): When there are many stops: small ticks stay quiet and only the current stop and the interchanges get a ring.
- `branch` (Reading order): In a narrow column or on a phone: a plain vertical list with the lines in its margin, like a commit graph, and no sideways scroll.

## Effects

Pass one as the `effect` prop.

- `ride` (Goal gradient): When the map is also a progress report: the line is inked up to the current station, so distance covered is visible at a glance.

## Usage

```tsx
import { MetroMap } from "@/components/ui/metro-map"

const lines = [
  {
    id: "research",
    label: "Research",
    tone: "muted",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "brief", label: "Brief", note: "Week 2", at: 1, lane: 1 },
    ],
  },
  {
    id: "build",
    label: "Build",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "launch", label: "Launch", at: 2, lane: 0 },
    ],
  },
]

<MetroMap label="Project plan" lines={lines} defaultSelected="brief" effect="ride" />
```

Exports: `MetroMap`
