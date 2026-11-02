import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Materialize } from "@/registry/miseui/ui/materialize"

export function Demo() {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "Dismiss" : "Summon"}
      </Button>
      <div className="min-h-28 w-full max-w-sm">
        <Materialize show={open} origin="top left">
          <div className="rounded-2xl bg-background p-5 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)]">
            <p className="text-[15px] font-medium">Summary ready</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Grows from the button that asked for it, blur clearing as it lands.
            </p>
          </div>
        </Materialize>
      </div>
    </div>
  )
}
