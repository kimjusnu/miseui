import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "station-dialog",
  title: "Station Dialog",
  category: "overlays",
  description: "A detail dialog that opens from a point on a map or list, knows where it came from and goes back there on close.",
  why: {
    principle: "Object constancy",
    explanation:
      "When something appears from nowhere, people have to work out what it belongs to. A surface that grows out of the point they pressed answers that without words, and returning focus to the same point means a keyboard user carries on exactly where they stopped.",
    avoid:
      "Do not use it for a form or a confirmation that interrupts a task: that is Dialog or Alert Dialog. If the detail needs its own address to be shared or bookmarked, give it a page.",
  },
  designs: [
    {
      name: "card",
      principle: "Focal point",
      use: "For a full account of one stop that deserves the reader's whole attention, with the page held back behind it.",
    },
    {
      name: "side",
      principle: "Continuity of context",
      use: "When people compare several points: the panel holds the detail and the map stays in view beside it.",
    },
    {
      name: "pin",
      principle: "Law of proximity",
      use: "For two or three lines about a point: the note sits beside it with nothing dimmed, and flips to stay on screen.",
    },
  ],
  effects: [
    {
      name: "morph",
      principle: "Spatial consistency",
      use: "When points are far apart on a map: the surface grows out of the one pressed and shrinks back to it. Reduced motion keeps a plain fade.",
    },
  ],
  usage: `import { StationDialog, StationDialogContent, StationDialogTrigger } from "@/components/ui/station-dialog"

const [open, setOpen] = useState<string | null>(null)
const station = stations.find((entry) => entry.id === open)

<StationDialog value={open} onValueChange={setOpen} effect="morph">
  {stations.map((entry) => (
    <StationDialogTrigger key={entry.id} value={entry.id}>{entry.name}</StationDialogTrigger>
  ))}
  <StationDialogContent title={station?.name} meta={station?.line}>
    {station?.summary}
  </StationDialogContent>
</StationDialog>`,
  exports: ["StationDialog", "StationDialogTrigger", "StationDialogContent"],
}
