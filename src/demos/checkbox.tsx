import { useId } from "react"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { Label } from "@/registry/miseui/ui/label"

export function Demo() {
  const termsId = useId()
  const updatesId = useId()
  const lockedId = useId()
  const drawId = useId()
  const drawMixedId = useId()
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id={termsId} />
          <Label htmlFor={termsId}>Accept terms and conditions</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={updatesId} defaultChecked />
          <Label htmlFor={updatesId}>Email me about updates</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={lockedId} disabled />
          <Label htmlFor={lockedId}>Required by your workspace</Label>
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="text-xs text-muted-foreground">draw</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id={drawId} effect="draw" />
            <Label htmlFor={drawId}>Tick me</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={drawMixedId} effect="draw" defaultChecked="indeterminate" />
            <Label htmlFor={drawMixedId}>Some selected</Label>
          </div>
        </div>
      </div>
    </div>
  )
}
