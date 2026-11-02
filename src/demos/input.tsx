import { useId, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

export function Demo() {
  const emailId = useId()
  const invalidId = useId()
  const glowId = useId()
  const aiId = useId()
  const [pending, setPending] = useState(true)
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input id={emailId} type="email" placeholder="you@example.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={invalidId}>Username</Label>
          <Input id={invalidId} aria-invalid defaultValue="mise ui" />
          <p className="text-sm text-destructive">Usernames cannot contain spaces.</p>
        </div>
        <Input disabled placeholder="Disabled" aria-label="Disabled example" />
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={glowId} className="font-mono text-xs text-muted-foreground">
            glow
          </Label>
          <Input id={glowId} effect="glow" placeholder="Click to focus" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={aiId} className="font-mono text-xs text-muted-foreground">
            ai
          </Label>
          <Input id={aiId} effect="ai" pending={pending} placeholder="Drafting a project title" />
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setPending((value) => !value)}>
            {pending ? "Finish" : "Draft again"}
          </Button>
        </div>
      </div>
    </div>
  )
}
