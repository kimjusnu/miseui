import { RoleMap, type RoleMember } from "@/registry/miseui/ui/role-map"

const MEMBERS: readonly RoleMember[] = [
  { name: "Ana", role: "Engineering", owns: ["API design", "Billing", "Data model"], lead: true },
  { name: "Theo", role: "Product design", owns: ["Interface", "Billing"] },
  { name: "Sami", role: "User research", owns: ["Interviews", "Interface"] },
]

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
      <Cell label="panels">
        <RoleMap members={MEMBERS} />
      </Cell>
      <Cell label="rows">
        <RoleMap members={MEMBERS} variant="rows" />
      </Cell>
      <Cell label="matrix">
        <RoleMap members={MEMBERS} variant="matrix" label="Billing launch, matrix" />
      </Cell>
      <Cell label="focus effect, point at or press a name">
        <RoleMap members={MEMBERS} variant="matrix" effect="focus" label="Billing launch, focus effect" />
      </Cell>
    </div>
  )
}
