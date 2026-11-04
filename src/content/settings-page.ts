import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "settings-page",
  title: "Settings Page",
  category: "blocks",
  description:
    "A settings screen in three decisions: one page with one save bar, one section at a time beside a side nav, or each group as its own plate with its own Save. The person and plan shown are sample data.",
  why: {
    principle: "Chunking and forgiveness",
    explanation:
      "A long form is tiring to scan, so related options sit in small named groups, with the label always in the same place and the control always in another. Nothing takes effect until Save, the save bar only exists while there is something to save, and Discard puts everything back, so people can try a change without fear. The destructive action is set apart, asks twice with focus on the safe answer, and offers an undo afterwards.",
    avoid:
      "Do not mix rows that apply instantly with rows that wait for Save in one group; people cannot tell which is which. If every setting saves on its own, drop the save bar altogether. Do not promise an undo on deletion that your backend cannot honour: write a different done message.",
  },
  designs: [
    {
      name: "sections",
      principle: "Chunking",
      use: "A handful of groups people read through in one sitting and save together.",
    },
    {
      name: "sidebar",
      principle: "Progressive disclosure",
      use: "Enough sections that one long page is a chore, and people come back for one setting at a time.",
    },
    {
      name: "cards",
      principle: "Proximity",
      use: "The groups have nothing to do with each other, so changing one must not wait on, or risk, the rest.",
    },
  ],
  usage: `import { SettingsPage } from "@/components/settings-page"

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

// One section at a time. Add an icon to each section for the side nav.
<SettingsPage variant="sidebar" sections={sections} onSave={save} />

// Each group has its own Save, and onSave receives one group at a time.
<SettingsPage variant="cards" sections={sections} onSave={(values) => api.updateSettings(values)} />`,
  exports: ["SettingsPage"],
}
