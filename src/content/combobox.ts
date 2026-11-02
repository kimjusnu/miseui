import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "combobox",
  title: "Combobox",
  category: "forms",
  description:
    "A searchable select for long lists, single or multiple, with people rows, section headers, chips and loading built in.",
  why: {
    principle: "Hick's law",
    explanation:
      "Decision time grows with the number of options, so past about fifteen rows typing a few letters beats scanning. Focus stays in the search box while arrow keys move a highlight through the list, which is what aria-activedescendant is for, so people can type and navigate without switching modes. The empty and loading rows say what happened instead of leaving a blank panel.",
    avoid:
      "Skip it for under about seven options, where a select or a radio group shows them with less work. It is not a free-text input: if people may enter a value that is not in the list, use an input with suggestions.",
  },
  designs: [
    {
      name: "plain",
      principle: "Signal to noise",
      use: "Use it when the label alone identifies the option, such as a country or a tag.",
    },
    {
      name: "avatar",
      principle: "Recognition over recall",
      use: "Use it for people or accounts, where a face or a role tells two similar names apart faster than reading.",
    },
    {
      name: "grouped",
      principle: "Chunking",
      use: "Use it when the options fall into groups people already know, such as regions or teams, so they can jump to the right section.",
    },
    {
      name: "tags",
      principle: "Visibility of state",
      use: "Use it for several choices that should stay in view and be removable in place, such as labels on an issue.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Object constancy",
      use: "Use it on a short list worked by arrow keys, where one highlight travelling makes the current row easy to track.",
    },
    {
      name: "materialize",
      principle: "Spatial continuity",
      use: "Use it for a combobox opened now and then, where the entrance can afford to be seen; for one used all day, the plain panel is quicker.",
    },
  ],
  usage: `import { Combobox } from "@/components/ui/combobox"

const people = [
  { value: "hana", label: "Hana Lim", description: "Product design", media: <Avatar /> },
  { value: "marco", label: "Marco Ruiz", description: "Backend", media: <Avatar /> },
]

<Combobox aria-label="Assignee" variant="avatar" options={people} onValueChange={setAssignee} />

// Several values, shown as chips
<Combobox aria-label="Labels" variant="tags" multiple options={labels} onValueChange={setLabels} />

// Your server does the searching; debounce onSearch yourself
<Combobox aria-label="City" options={results} loading={pending} onSearch={search} />`,
  exports: ["Combobox"],
}
