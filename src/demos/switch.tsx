import { useId } from "react"
import { Label } from "@/registry/miseui/ui/label"
import { Switch, type SwitchEffect } from "@/registry/miseui/ui/switch"

const EFFECTS: readonly SwitchEffect[] = ["gooey", "haptic"]

export function Demo() {
  const streamId = useId()
  const lockedId = useId()
  const effectId = useId()
  return (
    <div className="grid gap-6">
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
      <div className="flex flex-wrap gap-6">
        {EFFECTS.map((effect) => (
          <div key={effect} className="flex items-center gap-2">
            <Switch id={`${effectId}-${effect}`} effect={effect} defaultChecked={effect === "gooey"} />
            <Label htmlFor={`${effectId}-${effect}`} className="text-xs font-normal text-muted-foreground">
              {effect}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
