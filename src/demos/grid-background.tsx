import { Button } from "@/registry/miseui/ui/button"
import { GridBackground, type GridBackgroundProps } from "@/registry/miseui/ui/grid-background"

const PANEL_CLASS = "h-[200px] rounded-lg border"

function Panel({ label, title, body, action, ...props }: GridBackgroundProps & { label: string; title: string; body: string; action: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <GridBackground className={PANEL_CLASS} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="min-w-0">
            <p className="text-[15px] leading-5 font-medium text-foreground">{title}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
          </div>
          <Button size="sm">{action}</Button>
        </div>
      </GridBackground>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Panel label="lines" title="Plan the release on one board" body="Every task, owner and date in a single view." action="Open board" />
      <Panel label="fade" variant="fade" title="Invite the whole team" body="Seats are free until your first project ships." action="Send invites" />
      <Panel label="perspective" variant="perspective" title="Your roadmap, further out" body="See the next four quarters at a glance." action="View roadmap" />
      <Panel label="blocks" variant="blocks" title="Weekly usage report" body="Sent to your inbox every Monday morning." action="Turn on" />
      <Panel label="fade, pointer effect" variant="fade" effect="pointer" title="Move across this panel" body="The lines brighten around a mouse. Off on touch." action="Try the editor" />
      <Panel label="blocks, pointer effect" variant="blocks" effect="pointer" seed={21} title="Another seed, other cells" body="The same seed always fills the same cells." action="Copy link" />
    </div>
  )
}
