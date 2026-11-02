import { useId, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Label } from "@/registry/miseui/ui/label"
import { Textarea } from "@/registry/miseui/ui/textarea"

export function Demo() {
  const notesId = useId()
  const glowId = useId()
  const aiId = useId()
  const [pending, setPending] = useState(true)
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <Label htmlFor={notesId}>Instructions for the model</Label>
        <Textarea id={notesId} placeholder="Keep answers short. Prefer examples over definitions." />
        <p className="text-sm text-muted-foreground">The field grows as you type.</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={glowId} className="font-mono text-xs text-muted-foreground">
            glow
          </Label>
          <Textarea id={glowId} effect="glow" placeholder="Click to focus" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={aiId} className="font-mono text-xs text-muted-foreground">
            ai
          </Label>
          <Textarea id={aiId} effect="ai" pending={pending} placeholder="Drafting a reply to the last message" />
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setPending((value) => !value)}>
            {pending ? "Finish" : "Draft again"}
          </Button>
        </div>
      </div>
    </div>
  )
}
