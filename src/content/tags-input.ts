import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "tags-input",
  title: "Tags Input",
  category: "forms",
  description: "A field for many short values, added with Enter or a comma, or pasted as a whole list at once.",
  why: {
    principle: "Flexibility and efficiency of use",
    explanation:
      "People arrive with a list in their head or on their clipboard. Taking it the way they already separate things, by comma, by new line or one at a time, saves a form row per value, and each entry turns into an object they can see and remove on its own.",
    avoid:
      "Do not use it when the choices are a fixed short set: checkboxes show them all without typing. For a long fixed list with no free text, a multiple combobox is clearer.",
  },
  designs: [
    {
      name: "plain",
      principle: "Law of common region",
      use: "The default: chips inside one field, so several values read as one answer in a form.",
    },
    {
      name: "inline",
      principle: "Signal to noise ratio",
      use: "In a document-like screen such as a post's keywords, where boxes would be heavier than the text around them.",
    },
    {
      name: "stacked",
      principle: "Visibility of system status",
      use: "When each entry is long or matters on its own, such as email invitations, and needs a full row and an obvious Add button.",
    },
    {
      name: "compact",
      principle: "Information density",
      use: "In a toolbar or a filter row, where the field has to keep one line and the tags scroll inside it.",
    },
  ],
  effects: [
    {
      name: "pop",
      principle: "Immediate feedback",
      use: "When entries are added one by one: the tag scales into place and the others slide over, so it is clear the input was taken.",
    },
  ],
  usage: `import { TagsInput } from "@/components/ui/tags-input"

<TagsInput aria-label="Skills" placeholder="Add a skill" suggestions={["React", "Figma"]} max={8} effect="pop" />

<TagsInput
  aria-label="Invite by email"
  variant="stacked"
  name="emails"
  validate={(tag) => (tag.includes("@") ? null : "Enter an email address.")}
/>`,
  exports: ["TagsInput"],
}
