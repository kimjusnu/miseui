import { Button } from "@/registry/miseui/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogEffect,
} from "@/registry/miseui/ui/dialog"

const EFFECTS: readonly DialogEffect[] = ["materialize", "scrim-blur"]

function DeleteDialog({ effect }: { effect?: DialogEffect }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{effect ? "Open" : "Delete project"}</Button>
      </DialogTrigger>
      <DialogContent effect={effect}>
        <DialogHeader>
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>
            All files and history go with it. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep it</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Demo() {
  return (
    <div className="grid justify-items-start gap-6">
      <DeleteDialog />
      <div className="flex flex-wrap gap-4">
        {EFFECTS.map((effect) => (
          <div key={effect} className="grid justify-items-start gap-1.5">
            <p className="text-xs text-muted-foreground">{effect}</p>
            <DeleteDialog effect={effect} />
          </div>
        ))}
      </div>
    </div>
  )
}
