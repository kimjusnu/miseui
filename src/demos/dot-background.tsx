import { Button } from "@/registry/miseui/ui/button"
import { DotBackground, type DotBackgroundProps } from "@/registry/miseui/ui/dot-background"

const PANEL_CLASS = "h-[200px] rounded-lg border"

function Panel({ label, title, body, action, ...props }: DotBackgroundProps & { label: string; title: string; body: string; action: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <DotBackground className={PANEL_CLASS} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="min-w-0">
            <p className="text-[15px] leading-5 font-medium text-foreground">{title}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
          </div>
          <Button size="sm">{action}</Button>
        </div>
      </DotBackground>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Panel label="dots" title="Nothing on this canvas yet" body="Drag a file here or start from a template." action="New canvas" />
      <Panel label="fade" variant="fade" title="Your first invoice is ready" body="Check the details before it goes out on Friday." action="Review invoice" />
      <Panel label="plus" variant="plus" title="Measure before you ship" body="Page weight and load time on every pull request." action="Add a check" />
      <Panel label="halftone" variant="halftone" title="Reports that read themselves" body="One summary a week, written from your own numbers." action="See a sample" />
      <Panel label="dots, pointer effect" effect="pointer" title="Move across this panel" body="The dots take the accent around a mouse. Off on touch." action="Open canvas" />
      <Panel label="halftone, pointer effect" variant="halftone" effect="pointer" title="Works on every variant" body="The second copy follows the same drawing." action="Copy code" />
    </div>
  )
}
