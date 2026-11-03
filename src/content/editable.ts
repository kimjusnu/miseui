import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "editable",
  title: "Editable",
  category: "forms",
  description: "Text that turns into a field in place without moving the page: Enter commits, Escape reverts, leaving commits or reverts by prop, with validation and optional buttons.",
  why: {
    principle: "Direct manipulation",
    explanation:
      "People change a thing by acting on the thing itself, with no trip to a settings screen and no form to find. The read view and the field share one box, so the text stays exactly under the eye, and the page does not move when editing starts.",
    avoid:
      "Do not use it where the value needs review before saving, or for many fields that change together; a form states that better. Do not make it the only way to discover that something can be edited on touch, where there is no hover.",
  },
  designs: [
    {
      name: "text",
      principle: "Figure and ground",
      use: "For a short value inside other content, such as a name in a table row. Long values truncate to keep the row height.",
    },
    {
      name: "heading",
      principle: "Direct manipulation",
      use: "For the title of a page or a document, where the title itself is the control. Long titles wrap rather than truncate.",
    },
    {
      name: "area",
      principle: "Error prevention",
      use: "For a description or a note. Enter makes a new line, so saving is an explicit button or Mod+Enter.",
    },
    {
      name: "field",
      principle: "Signifiers",
      use: "On a settings page, where the hover box and the pencil say the row is editable before anyone tries it.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Attention through motion",
      use: "When the action buttons should draw the eye as they appear, so that saving is obvious the first time.",
    },
  ],
  usage: `import { Editable } from "@/components/ui/editable"

<Editable label="Project name" defaultValue="Spring launch" onValueChange={save} />

<Editable label="Page title" variant="heading" value={title} onValueChange={setTitle} />

<Editable
  label="Description"
  variant="area"
  effect="materialize"
  blurAction="revert"
  validate={(value) => (value.length > 280 ? "Keep it under 280 characters." : undefined)}
/>`,
  exports: ["Editable"],
}
