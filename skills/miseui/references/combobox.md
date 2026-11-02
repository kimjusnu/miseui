# Combobox

A searchable select for long lists, single or multiple, with people rows, section headers, chips and loading built in.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/combobox.json
```

## Why it looks like this

**Hick's law.** Decision time grows with the number of options, so past about fifteen rows typing a few letters beats scanning. Focus stays in the search box while arrow keys move a highlight through the list, which is what aria-activedescendant is for, so people can type and navigate without switching modes. The empty and loading rows say what happened instead of leaving a blank panel.

**Don't.** Skip it for under about seven options, where a select or a radio group shows them with less work. It is not a free-text input: if people may enter a value that is not in the list, use an input with suggestions.

## Designs

Pass one as the `variant` prop.

- `plain` (Signal to noise): Use it when the label alone identifies the option, such as a country or a tag.
- `avatar` (Recognition over recall): Use it for people or accounts, where a face or a role tells two similar names apart faster than reading.
- `grouped` (Chunking): Use it when the options fall into groups people already know, such as regions or teams, so they can jump to the right section.
- `tags` (Visibility of state): Use it for several choices that should stay in view and be removable in place, such as labels on an issue.

## Effects

Pass one as the `effect` prop.

- `spring` (Object constancy): Use it on a short list worked by arrow keys, where one highlight travelling makes the current row easy to track.
- `materialize` (Spatial continuity): Use it for a combobox opened now and then, where the entrance can afford to be seen; for one used all day, the plain panel is quicker.

## Usage

```tsx
import { Combobox } from "@/components/ui/combobox"

const people = [
  { value: "hana", label: "Hana Lim", description: "Product design", media: <Avatar /> },
  { value: "marco", label: "Marco Ruiz", description: "Backend", media: <Avatar /> },
]

<Combobox aria-label="Assignee" variant="avatar" options={people} onValueChange={setAssignee} />

// Several values, shown as chips
<Combobox aria-label="Labels" variant="tags" multiple options={labels} onValueChange={setLabels} />

// Your server does the searching; debounce onSearch yourself
<Combobox aria-label="City" options={results} loading={pending} onSearch={search} />
```

Exports: `Combobox`
