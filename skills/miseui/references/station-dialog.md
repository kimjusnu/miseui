# Station Dialog

A detail dialog that opens from a point on a map or list, knows where it came from and goes back there on close.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/station-dialog.json
```

## Why it looks like this

**Object constancy.** When something appears from nowhere, people have to work out what it belongs to. A surface that grows out of the point they pressed answers that without words, and returning focus to the same point means a keyboard user carries on exactly where they stopped.

**Don't.** Do not use it for a form or a confirmation that interrupts a task: that is Dialog or Alert Dialog. If the detail needs its own address to be shared or bookmarked, give it a page.

## Designs

Pass one as the `variant` prop.

- `card` (Focal point): For a full account of one stop that deserves the reader's whole attention, with the page held back behind it.
- `side` (Continuity of context): When people compare several points: the panel holds the detail and the map stays in view beside it.
- `pin` (Law of proximity): For two or three lines about a point: the note sits beside it with nothing dimmed, and flips to stay on screen.

## Effects

Pass one as the `effect` prop.

- `morph` (Spatial consistency): When points are far apart on a map: the surface grows out of the one pressed and shrinks back to it. Reduced motion keeps a plain fade.

## Usage

```tsx
import { StationDialog, StationDialogContent, StationDialogTrigger } from "@/components/ui/station-dialog"

const [open, setOpen] = useState<string | null>(null)
const station = stations.find((entry) => entry.id === open)

<StationDialog value={open} onValueChange={setOpen} effect="morph">
  {stations.map((entry) => (
    <StationDialogTrigger key={entry.id} value={entry.id}>{entry.name}</StationDialogTrigger>
  ))}
  <StationDialogContent title={station?.name} meta={station?.line}>
    {station?.summary}
  </StationDialogContent>
</StationDialog>
```

Exports: `StationDialog`, `StationDialogTrigger`, `StationDialogContent`
