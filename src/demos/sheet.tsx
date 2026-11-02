import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Sheet } from "@/registry/miseui/ui/sheet"

export function Demo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="mise" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <p className="text-sm text-muted-foreground">Drag it down slowly, or flick it. Catch it on the way out.</p>
      <Sheet open={open} onOpenChange={setOpen} title="Share this answer">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          The panel follows your pointer, resists past the top, and decides on release from where the flick was
          heading, not where it stopped.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="mise" onClick={() => setOpen(false)}>
            Copy link
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
