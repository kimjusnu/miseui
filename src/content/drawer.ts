import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "drawer",
  title: "Drawer",
  category: "overlays",
  description: "A panel that slides in from an edge for a side task, so the page you came from stays where you left it.",
  why: {
    principle: "Spatial continuity",
    explanation:
      "A panel that arrives from an edge keeps the page in peripheral view, so people know where they are and how to get back. It holds more than a dialog without the cost of a navigation, and Escape or the corner button returns them to the exact scroll position they left.",
    avoid:
      "Do not use a drawer for a two-button confirmation; that is a dialog. Do not open a drawer from inside a drawer, and do not use one for the main task of a page.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "For filters or details in a dashboard, where a full-height panel at the edge reads as part of the application frame.",
    },
    {
      name: "floating",
      principle: "Perceived depth",
      use: "When the page should stay visible all around the panel, so it reads as a temporary layer over the work.",
    },
    {
      name: "split",
      principle: "Parallel task support",
      use: "For notes or a chat beside the page, when people must keep reading and clicking the content behind it.",
    },
    {
      name: "sheet",
      principle: "Fitts's law",
      use: "On phones, where the bottom edge is in thumb reach and pulling the handle down is the natural way out.",
    },
  ],
  effects: [
    {
      name: "push",
      principle: "Depth of field",
      use: "When the panel takes over the task: it comes into focus as the page recedes behind a deep blur.",
    },
  ],
  usage: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter, DrawerClose } from "@/components/ui/drawer"

<Drawer side="right" variant="floating" effect="push">
  <DrawerTrigger>Filters</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filters</DrawerTitle>
      <DrawerDescription>Narrow the list of invoices.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody>…</DrawerBody>
    <DrawerFooter><DrawerClose>Apply</DrawerClose></DrawerFooter>
  </DrawerContent>
</Drawer>`,
  exports: [
    "Drawer",
    "DrawerTrigger",
    "DrawerClose",
    "DrawerContent",
    "DrawerHeader",
    "DrawerBody",
    "DrawerFooter",
    "DrawerTitle",
    "DrawerDescription",
  ],
}
