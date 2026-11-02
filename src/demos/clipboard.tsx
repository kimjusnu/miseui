import { Clipboard } from "@/registry/miseui/ui/clipboard"

const COMMAND = "pnpm dlx shadcn@latest add https://miseui.junsu4621.workers.dev/r/clipboard.json"
const LINK = "https://example.com/invite/8f2c-41ad"
const SCRIPT = `pnpm install --frozen-lockfile
pnpm test
pnpm build`

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
      <Cell label="icon">
        <div className="flex min-w-0 items-center gap-1">
          <span className="min-w-0 truncate font-mono text-[13px]">ord_71KQ3M</span>
          <Clipboard value="ord_71KQ3M" label="Copy order number" />
        </div>
      </Cell>
      <Cell label="inline">
        <Clipboard variant="inline" value={COMMAND} valueLabel="Install command" label="Copy install command" />
      </Cell>
      <Cell label="field">
        <Clipboard variant="field" value={LINK} valueLabel="Invite link" />
      </Cell>
      <Cell label="block">
        <Clipboard variant="block" title="deploy.sh" value={SCRIPT} valueLabel="Deploy script" />
      </Cell>
      <Cell label="morph effect, icon">
        <div className="flex min-w-0 items-center gap-1">
          <span className="min-w-0 truncate font-mono text-[13px]">ord_71KQ3M</span>
          <Clipboard value="ord_71KQ3M" effect="morph" label="Copy order number" />
        </div>
      </Cell>
      <Cell label="morph effect, field">
        <Clipboard variant="field" value={LINK} valueLabel="Invite link" effect="morph" />
      </Cell>
    </div>
  )
}
