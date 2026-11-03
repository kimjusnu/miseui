import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "dock",
  title: "Dock",
  category: "navigation",
  description: "A row of icon buttons that swell near the pointer and rise without moving the page: a glass bar, bare tiles, a side rail or words under every icon.",
  why: {
    principle: "Fitts's law",
    explanation:
      "A target that grows as the pointer approaches is easier to hit, and the swell around the pointer shows which icons are within reach before anyone has to read them. The growth is drawn with transforms inside space the dock reserves, so nothing around it moves.",
    avoid:
      "Do not use icons alone for things people have to guess at; use `labeled`, or a plain sidebar or tabs when there are more than about seven places. A person on a phone never sees the swell or the tooltips, so nothing may depend on them.",
  },
  designs: [
    {
      name: "glass",
      principle: "Figure and ground",
      use: "Floating over a picture, a canvas or a map, where a translucent bar keeps the work visible behind it. It turns solid for people who ask for less transparency.",
    },
    {
      name: "plain",
      principle: "Law of similarity",
      use: "On a calm page with no surface to float over, where each item is its own small key and the current one is filled.",
    },
    {
      name: "vertical",
      principle: "Serial position effect",
      use: "A side rail beside the work, where a wide screen has height to spare and the first and last items are the easiest to find.",
    },
    {
      name: "labeled",
      principle: "Recognition over recall",
      use: "For people who should not have to guess or hover: the word is always there, as on a phone's tab bar.",
    },
  ],
  effects: [
    {
      name: "magnify",
      principle: "Fitts's law",
      use: "A short row of places on a device with a pointer. Keyboard focus swells too. A row too long for its box scrolls inside itself and stays at rest, because a scroller would clip the swell.",
    },
    {
      name: "bounce",
      principle: "Feedback",
      use: "When pressing an item starts something that takes a moment to appear. Mark those items with `opens`; items that only switch a view stay still.",
    },
  ],
  usage: `import { Dock, DockItem } from "@/components/ui/dock"
import { Files, Home, Inbox } from "lucide-react"

<Dock label="Apps" variant="glass" effect="magnify">
  <DockItem label="Home" href="/" active><Home /></DockItem>
  <DockItem label="Inbox" href="/inbox"><Inbox /></DockItem>
  <DockItem label="Files" opens onClick={openFiles}><Files /></DockItem>
</Dock>`,
  exports: ["Dock", "DockItem"],
}
