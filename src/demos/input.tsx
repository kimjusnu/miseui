import { useId } from "react"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

export function Demo() {
  const emailId = useId()
  const invalidId = useId()
  return (
    <div className="grid w-full max-w-sm gap-4">
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
  )
}
