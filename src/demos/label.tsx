import { useId } from "react"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

export function Demo() {
  const nameId = useId()
  const lockedId = useId()
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={nameId}>Display name</Label>
        <Input id={nameId} placeholder="Click the label to focus me" />
      </div>
      <div className="grid gap-2">
        <Input id={lockedId} className="peer" disabled defaultValue="Read only" />
        <Label htmlFor={lockedId}>Workspace (dims with its disabled input)</Label>
      </div>
    </div>
  )
}
