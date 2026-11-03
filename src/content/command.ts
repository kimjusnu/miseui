import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "command",
  title: "Command",
  category: "overlays",
  description: "A command palette with its own fuzzy search: groups, shortcuts, recent items, an empty state, full combobox and listbox semantics and a Mod+K helper.",
  why: {
    principle: "Hick's law",
    explanation:
      "Choosing among fifty visible commands is slow, while typing two letters of the one you already have in mind is not. A palette replaces scanning with recall, works from anywhere in the app, and the shortcut beside each result teaches the faster way the next time.",
    avoid:
      "Do not make it the only route to anything: people who do not know a command exists cannot type it. Keep the main navigation visible, and treat this as the shortcut on top of it.",
  },
  designs: [
    {
      name: "dialog",
      principle: "Modal focus",
      use: "As the app-wide palette on Mod+K. The footer teaches the keys to people who opened it for the first time.",
    },
    {
      name: "inline",
      principle: "Direct access",
      use: "On a page that is itself about searching, such as a help center or an empty dashboard, where no shortcut has to be known.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "In a popover, a sidebar or a small panel: tight rows and no section headings make room for more results.",
    },
    {
      name: "spotlight",
      principle: "Visual hierarchy",
      use: "When search is the first thing to do. One large input stays alone on screen until it has results to show.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Continuity",
      use: "When results change often while typing: the height eases to the new list so the panel does not jump under the eye.",
    },
  ],
  usage: `import { useState } from "react"
import { Command, pushRecent, useCommandShortcut } from "@/components/ui/command"

function Palette() {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  useCommandShortcut(() => setOpen((current) => !current))
  return (
    <Command
      open={open}
      onOpenChange={setOpen}
      effect="materialize"
      recent={recent}
      onSelect={(value) => setRecent((list) => pushRecent(list, value))}
      items={[
        { value: "projects", label: "Go to Projects", group: "Navigate", shortcut: ["G", "P"] },
        { value: "settings", label: "Settings", group: "Navigate", keywords: ["preferences"] },
      ]}
    />
  )
}`,
  exports: ["Command", "pushRecent", "useCommandShortcut"],
}
