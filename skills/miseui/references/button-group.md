# Button Group

Related actions joined under one border, across or down, including a main action with a menu of its alternatives.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/button-group.json
```

## Why it looks like this

**Law of common region.** One shared border says these actions belong to the same object, so the eye reads one control instead of counting several. A split button goes further: the common action stays one click away while its rarer alternatives wait in a menu, without adding more buttons to the page.

**Don't.** These are actions and hold no state. If one option stays chosen, use Toggle Group or Segmented Control. Do not join unrelated actions just to save space, and do not join a destructive action to a safe one where a slip would cost something.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): On a toolbar or a quiet header, where one soft fill groups the actions without adding a line.
- `outline` (Law of connectedness): The default: secondary actions on a record or a message, with hairlines that stay out of the content's way.
- `split` (Hick's law): When one action is what most people want and the others are rarer, such as publish now against schedule.
- `pill` (Law of proximity): On media or a canvas, where a floating tray holds a few loosely related actions with room between them.

## Effects

Pass one as the `effect` prop.

- `press` (Doherty threshold): When actions repeat quickly: the label dips on the first frame and the joined border stays still, so the group never looks broken.

## Usage

```tsx
import { ButtonGroup, ButtonGroupItem, ButtonGroupMenu } from "@/components/ui/button-group"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

<ButtonGroup aria-label="Message">
  <ButtonGroupItem>Reply</ButtonGroupItem>
  <ButtonGroupItem>Forward</ButtonGroupItem>
</ButtonGroup>

<ButtonGroup variant="split" aria-label="Publish" effect="press">
  <ButtonGroupItem>Publish</ButtonGroupItem>
  <ButtonGroupMenu label="More publish options">
    <DropdownMenuItem>Schedule for later</DropdownMenuItem>
  </ButtonGroupMenu>
</ButtonGroup>
```

Exports: `ButtonGroup`, `ButtonGroupItem`, `ButtonGroupMenu`
