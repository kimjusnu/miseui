import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "dialog",
  title: "Dialog",
  category: "overlays",
  description: "Modal surface that dims everything else and holds focus until the user answers one question.",
  why: {
    principle: "Attention funnel",
    explanation:
      "A decision made among forty other controls is a decision made badly. The dialog fades the page behind it and traps focus, so the choice narrows to the few buttons in its footer. The 240 ms zoom shows where the surface came from, and Escape or the corner button always lets the user back out.",
    avoid:
      "Do not open a dialog for information that could sit inline, and never stack one dialog on another. Keep long forms out of it; a full page keeps the user's context visible.",
  },
  effects: [
    {
      name: "materialize",
      principle: "Focus pull",
      use: "Use it for a routine dialog that should arrive with presence while the page stays legible behind the usual scrim.",
    },
    {
      name: "scrim-blur",
      principle: "Depth of field",
      use: "Use it for a decision that deserves the whole screen, such as a destructive confirmation, where the page should stop competing for attention.",
    },
  ],
  usage: `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Delete project</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this project?</DialogTitle>
      <DialogDescription>All files and history go with it. This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// <DialogContent effect="materialize"> brings the surface into focus; effect="scrim-blur" pushes the page back behind it.`,
  exports: [
    "Dialog",
    "DialogTrigger",
    "DialogPortal",
    "DialogClose",
    "DialogOverlay",
    "DialogContent",
    "DialogHeader",
    "DialogFooter",
    "DialogTitle",
    "DialogDescription",
  ],
}
