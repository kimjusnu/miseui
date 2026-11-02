# Dialog

Modal surface that dims everything else and holds focus until the user answers one question.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/dialog.json
```

## Why it looks like this

**Attention funnel.** A decision made among forty other controls is a decision made badly. The dialog fades the page behind it and traps focus, so the choice narrows to the few buttons in its footer. The 240 ms zoom shows where the surface came from, and Escape or the corner button always lets the user back out.

**Don't.** Do not open a dialog for information that could sit inline, and never stack one dialog on another. Keep long forms out of it; a full page keeps the user's context visible.

## Usage

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Delete project</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this project?</DialogTitle>
      <DialogDescription>All files and history go with it. This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Exports: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
