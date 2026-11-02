import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "resizable",
  title: "Resizable",
  category: "display",
  description: "Two panes with a draggable divider, horizontal or vertical, with limits that stretch, a keyboard-operable separator and a double-click reset.",
  why: {
    principle: "User control and freedom",
    explanation:
      "No fixed split suits both a person reading code and one reading a file list, so the split is theirs to choose. The limit stretches instead of stopping dead, which says nothing more is there, and a double-click always gets them back to where they started.",
    avoid:
      "Do not use one on a phone, where there is no room for two panes; stack them or use tabs. Do not make people resize to fix a bad default. Remember the size between visits, or they will do it again every time.",
  },
  designs: [
    {
      name: "line",
      principle: "Figure and ground",
      use: "The default in a dense tool: a hairline at rest, with a generous invisible target around it.",
    },
    {
      name: "grip",
      principle: "Affordance",
      use: "When people may not know it moves: a visible handle says so, which matters most in a product used rarely.",
    },
    {
      name: "gap",
      principle: "Law of common region",
      use: "For dashboards and editors built from separate cards, where the space between them is the handle.",
    },
    {
      name: "hidden",
      principle: "Aesthetic and minimalist design",
      use: "For reading layouts, where nothing marks the seam until the pointer reaches it or the keyboard lands on it.",
    },
  ],
  effects: [
    {
      name: "snap",
      principle: "Momentum projection",
      use: "For a sidebar people often hide: a flick collapses it, judged by where the hand's speed would carry it, and Enter brings it back.",
    },
  ],
  usage: `import { Resizable } from "@/components/ui/resizable"

<Resizable className="h-96" defaultSize={30} min={20} max={60} handleLabel="Resize sidebar">
  <Sidebar />
  <Main />
</Resizable>

<Resizable direction="vertical" variant="grip" effect="snap" className="h-96">
  <Editor />
  <Terminal />
</Resizable>`,
  exports: ["Resizable"],
}
