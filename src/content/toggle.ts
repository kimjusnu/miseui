import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "toggle",
  title: "Toggle",
  category: "forms",
  description: "A button that stays pressed, for turning a view or format on and off without leaving the page.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "A pressed button shows its state at rest, so nobody has to remember whether bold or the filter is on. One click undoes it, which makes trying an option cheap and keeps people exploring.",
    avoid:
      "For a setting that saves and takes effect somewhere else, use Switch. When exactly one option must be chosen, use a radio group. Never change the label when pressed: the state already says it.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In a toolbar, where buttons sit in a row and only the ones switched on should stand out.",
    },
    {
      name: "outline",
      principle: "Affordance",
      use: "Standing alone in a form or page header, where the border says this can be pressed before anyone tries.",
    },
    {
      name: "pill",
      principle: "Recognition over recall",
      use: "For filter chips above a list: the check and solid fill make every active filter readable at a glance.",
    },
    {
      name: "icon",
      principle: "Von Restorff effect",
      use: "For one well-known action such as favourite or mute, where a single accent square marks it as on.",
    },
  ],
  effects: [
    {
      name: "pop",
      principle: "Feedback",
      use: "When the moment deserves a small reward, such as a favourite: the content grows into place on switching on, and switching off simply stops.",
    },
  ],
  usage: `import { Toggle } from "@/components/ui/toggle"

<Toggle variant="outline" defaultPressed>Show archived</Toggle>
<Toggle variant="pill" pressed={remote} onPressedChange={setRemote}>Remote</Toggle>
<Toggle variant="icon" effect="pop" aria-label="Favourite"><Star /></Toggle>`,
  exports: ["Toggle"],
}
