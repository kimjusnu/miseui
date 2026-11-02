# Empty

What a list or a search shows when it has nothing: an icon, a plain reason and the next step, centred, in a dashed slot, on a card or in one row.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/empty.json
```

## Why it looks like this

**Help users recover.** An empty area looks like a fault until something says otherwise. Saying why it is empty and offering the one step out of it turns a dead end into the next move. The title states the fact, the description gives the reason, and the action is the way forward.

**Don't.** Do not use it while data is still loading; that is a skeleton. Do not write jokes or apologies in it, and do not offer an action the person cannot take. For the first screen of a new product, use the Empty State block.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): In the main area of a page, such as search results, where there is already plenty of space around it.
- `dashed` (Signifiers): Where something can be added, such as a project with no files: the dashed edge marks a slot that is waiting.
- `card` (Law of common region): In a dashboard grid, where the empty widget should keep the same shape as the filled widgets beside it.
- `compact` (Economy of attention): In a sidebar, a table section or a dropdown, where one row says enough and a large block would push real content down.

## Effects

Pass one as the `effect` prop.

- `materialize` (Continuity): When results disappear as someone types or filters: the message comes into focus, so it reads as an answer and not as a page that broke.

## Usage

```tsx
import { Empty } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

<Empty
  variant="dashed"
  icon={<FolderPlus />}
  title="No files in this project"
  description="Drop a file here or start from a template."
  actions={<Button size="sm">Upload file</Button>}
/>

<Empty variant="compact" effect="materialize" announce title="No matches" />
```

Exports: `Empty`
