import { PasswordInput } from "@/registry/miseui/ui/password-input"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <PasswordInput aria-label="Password" defaultValue="winter-tram-41" />
      </Cell>
      <Cell label="strength">
        <PasswordInput variant="strength" aria-label="New password" defaultValue="winter-tram" />
      </Cell>
      <Cell label="checklist">
        <PasswordInput variant="checklist" aria-label="New password" defaultValue="Winter-tram" />
      </Cell>
      <Cell label="inline">
        <PasswordInput variant="inline" aria-label="New password" defaultValue="winter-tram-41" />
      </Cell>
      <Cell label="spring effect, strength">
        <PasswordInput variant="strength" effect="spring" aria-label="New password" placeholder="Type to see it move" />
      </Cell>
      <Cell label="spring effect, inline">
        <PasswordInput variant="inline" effect="spring" aria-label="New password" placeholder="Type to see it move" />
      </Cell>
      <Cell label="invalid">
        <PasswordInput aria-label="Password" aria-invalid defaultValue="wrong-password" />
      </Cell>
      <Cell label="disabled">
        <PasswordInput aria-label="Password" disabled defaultValue="locked-account" />
      </Cell>
    </div>
  )
}
