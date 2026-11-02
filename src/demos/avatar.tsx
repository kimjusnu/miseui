import { Avatar, AvatarGroup, type AvatarStatus } from "@/registry/miseui/ui/avatar"

const PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#d9c7b2"/><circle cx="40" cy="31" r="15" fill="#8a6a4f"/><path d="M12 80c2-20 14-29 28-29s26 9 28 29z" fill="#3f4a5a"/></svg>`
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(PORTRAIT_SVG)}`

const TEAM = ["Mina Park", "Tomas Reyes", "Aisha Khan", "Leo Martin", "Hana Sato", "Noor Ali", "Ivan Petrov"]
const STATUSES: readonly AvatarStatus[] = ["online", "away", "busy", "offline"]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="circle">
        <Avatar name="Mina Park" src={PORTRAIT} />
        <Avatar name="Tomas Reyes" />
        <Avatar name="Aisha Khan" />
      </Cell>
      <Cell label="rounded">
        <Avatar name="Design Team" variant="rounded" />
        <Avatar name="Billing Ops" variant="rounded" />
        <Avatar name="Mobile Guild" variant="rounded" />
      </Cell>
      <Cell label="ring">
        <Avatar name="Tomas Reyes" />
        <Avatar name="Aisha Khan" variant="ring" />
        <Avatar name="Leo Martin" />
      </Cell>
      <Cell label="status">
        {STATUSES.map((status, index) => (
          <Avatar key={status} name={TEAM[index]} variant="status" status={status} />
        ))}
      </Cell>
      <Cell label="sizes">
        <Avatar name="Hana Sato" size="sm" />
        <Avatar name="Hana Sato" size="md" />
        <Avatar name="Hana Sato" size="lg" />
      </Cell>
      <Cell label="group">
        <AvatarGroup max={3}>
          {TEAM.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </Cell>
      <Cell label="stack effect, hover the group">
        <AvatarGroup max={4} effect="stack">
          {TEAM.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarGroup>
      </Cell>
    </div>
  )
}
