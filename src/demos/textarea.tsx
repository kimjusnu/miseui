import { useId } from "react"
import { Label } from "@/registry/miseui/ui/label"
import { Textarea } from "@/registry/miseui/ui/textarea"

export function Demo() {
  const notesId = useId()
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={notesId}>Instructions for the model</Label>
      <Textarea id={notesId} placeholder="Keep answers short. Prefer examples over definitions." />
      <p className="text-sm text-muted-foreground">The field grows as you type.</p>
    </div>
  )
}
