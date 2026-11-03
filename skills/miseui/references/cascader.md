# Cascader

Pick from nested options: columns on wide screens, one level at a time on phones, with search, full keyboard, lazy children and the path shown in the trigger.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/cascader.json
```

## Why it looks like this

**Hick's law.** A list of two hundred cities is slow to read, but ten countries and then twenty cities is two short decisions. Each level narrows the next, and the trigger keeps the whole path visible, so people can see how they got there. Search skips the walk for those who already know the name.

**Don't.** Do not use it for a flat list; a select or a combobox is simpler. Do not use it past three or four levels, where people lose their place. If most people know the name they want, lead with a combobox and search instead.

## Designs

Pass one as the `variant` prop.

- `plain` (Recognition over recall): In a form, where the field keeps the page calm until opened and its value reads as a path.
- `inline` (Visibility of options): When choosing is the main task of the page, such as picking a category for a new listing.
- `compact` (Information density): In a filter row or a table cell, with a shorter field, narrower columns and tighter rows.
- `multiple` (Direct manipulation): When several leaves can apply, such as regions for a campaign. A box on a parent ticks everything under it and shows when only some are ticked.

## Effects

Pass one as the `effect` prop.

- `slide` (Shared axis): On phones, where levels replace each other: moving in slides from the right and going back slides from the left, so the list reads as a place you walk through.

## Usage

```tsx
import { Cascader, type CascaderOption } from "@/components/ui/cascader"

const options: CascaderOption[] = [
  {
    value: "korea",
    label: "Korea",
    children: [{ value: "seoul", label: "Seoul" }],
  },
  { value: "japan", label: "Japan", lazy: true },
]

<Cascader
  aria-label="Office"
  options={options}
  effect="slide"
  loadChildren={(path) => fetchCities(path)}
  onValueChange={(path) => setOffice(path)}
/>

<Cascader variant="multiple" aria-label="Regions" options={options} onValueChange={setRegions} />
```

Exports: `Cascader`
