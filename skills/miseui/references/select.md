# Select

Dropdown for one choice from a list, with a placeholder, groups, a check on the chosen row and full keyboard support.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/select.json
```

## Why it looks like this

**Default effect.** Most people keep whatever is preselected, so the default you pass is the answer most users will give; choose it deliberately. The trigger shows the current value in place, the list opens aligned to it with the chosen row focused, and a check mark confirms the choice so the user can scan instead of reading every row.

**Don't.** Skip it for fewer than four options, where radio buttons show everything at once, and for more than about fifteen, where a searchable combobox is faster. Never use it to trigger navigation on change.

## Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select defaultValue="weekly">
  <SelectTrigger className="w-44">
    <SelectValue placeholder="Digest frequency" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="daily">Daily</SelectItem>
    <SelectItem value="weekly">Weekly</SelectItem>
    <SelectItem value="never">Never</SelectItem>
  </SelectContent>
</Select>
```

Exports: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`
