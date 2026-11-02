# Tree View

A nested list that opens level by level, with the full keyboard pattern people know from file explorers.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/tree-view.json
```

## Why it looks like this

**Progressive disclosure.** A deep hierarchy is unreadable all at once. Showing one level and letting people open the branch they care about keeps their place visible, and indentation says what belongs to what without any extra words.

**Don't.** Do not use it for shallow data: one level is a list and two are usually groups. Do not use it as primary site navigation on a phone, where deep rows run out of width.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): The default for a side panel, where indentation alone carries the structure.
- `lines` (Law of continuity): For deep hierarchies such as a code folder, where a rule running down each level shows what sits inside what.
- `compact` (Information density): When hundreds of rows have to fit, such as a data catalogue, and icons would only add weight.
- `card` (Law of common region): When the top level is a few separate things, such as projects, each with its own contents.

## Effects

Pass one as the `effect` prop.

- `spring` (Interruptibility): When people open and close branches quickly: the height continues from where it is, so a second press reverses instead of jumping.

## Usage

```tsx
import { TreeView } from "@/components/ui/tree-view"

const nodes = [
  { id: "src", label: "src", children: [{ id: "app", label: "App.tsx" }] },
  { id: "remote", label: "Remote files", lazy: true },
]

<TreeView aria-label="Files" nodes={nodes} variant="lines" effect="spring" selectionMode="single" defaultExpanded={["src"]} />

// Lazy: load when a branch opens, then pass its children in nodes.
<TreeView aria-label="Files" nodes={nodes} onExpandedChange={(_, change) => change.expanded && load(change.id)} />
```

Exports: `TreeView`
