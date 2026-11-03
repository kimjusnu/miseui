# Command

A command palette with its own fuzzy search: groups, shortcuts, recent items, an empty state, full combobox and listbox semantics and a Mod+K helper.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/command.json
```

## Why it looks like this

**Hick's law.** Choosing among fifty visible commands is slow, while typing two letters of the one you already have in mind is not. A palette replaces scanning with recall, works from anywhere in the app, and the shortcut beside each result teaches the faster way the next time.

**Don't.** Do not make it the only route to anything: people who do not know a command exists cannot type it. Keep the main navigation visible, and treat this as the shortcut on top of it.

## Designs

Pass one as the `variant` prop.

- `dialog` (Modal focus): As the app-wide palette on Mod+K. The footer teaches the keys to people who opened it for the first time.
- `inline` (Direct access): On a page that is itself about searching, such as a help center or an empty dashboard, where no shortcut has to be known.
- `compact` (Information density): In a popover, a sidebar or a small panel: tight rows and no section headings make room for more results.
- `spotlight` (Visual hierarchy): When search is the first thing to do. One large input stays alone on screen until it has results to show.

## Effects

Pass one as the `effect` prop.

- `materialize` (Continuity): When results change often while typing: the height eases to the new list so the panel does not jump under the eye.

## Usage

```tsx
import { useState } from "react"
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
}
```

Exports: `Command`, `pushRecent`, `useCommandShortcut`
