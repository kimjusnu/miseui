# Settings Page

A settings screen in grouped rows, with a save bar that appears only when something changed and a destructive area kept well away from the rest. The person and plan shown are sample data.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/settings-page.json
```

## Why it looks like this

**Chunking and forgiveness.** A long form is tiring to scan, so related options sit in small named groups, with the label always in the same place and the control always in another. Nothing takes effect until Save, the save bar only exists while there is something to save, and Discard puts everything back, so people can try a change without fear. The destructive action is set apart, asks twice with focus on the safe answer, and offers an undo afterwards.

**Don't.** Do not mix rows that apply instantly with rows that wait for Save in one group; people cannot tell which is which. If every setting saves on its own, drop the save bar altogether. Do not promise an undo on deletion that your backend cannot honour: write a different done message.

## Usage

```tsx
import { SettingsPage } from "@/components/settings-page"

<SettingsPage
  sections={[
    {
      id: "profile",
      title: "Profile",
      rows: [
        {
          kind: "text",
          id: "name",
          label: "Display name",
          value: user.name,
          validate: (value) => (value.trim() ? undefined : "Add a name."),
        },
        { kind: "switch", id: "digest", label: "Weekly summary", value: user.digest },
      ],
    },
  ]}
  onSave={(values, changedIds) => api.updateSettings(values)}
/>
```

Exports: `SettingsPage`
