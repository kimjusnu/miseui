import { useId } from "react"
import { Label } from "@/registry/miseui/ui/label"
import { Switch } from "@/registry/miseui/ui/switch"

export function Demo() {
  const streamId = useId()
  const lockedId = useId()
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Switch id={streamId} defaultChecked />
        <Label htmlFor={streamId}>Stream responses</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id={lockedId} disabled />
        <Label htmlFor={lockedId}>Share usage data (managed)</Label>
      </div>
    </div>
  )
}
