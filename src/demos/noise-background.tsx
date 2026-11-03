import { Button } from "@/registry/miseui/ui/button"
import { NoiseBackground, type NoiseBackgroundProps } from "@/registry/miseui/ui/noise-background"

const PANEL_CLASS = "h-[200px] rounded-lg border"

function Panel({ label, title, body, action, ...props }: NoiseBackgroundProps & { label: string; title: string; body: string; action: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <NoiseBackground className={PANEL_CLASS} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="min-w-0">
            <p className="text-[15px] leading-5 font-medium text-foreground">{title}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
          </div>
          <Button size="sm">{action}</Button>
        </div>
      </NoiseBackground>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Panel label="grain" title="Notes that stay yours" body="Export everything whenever you want, in plain text." action="Start writing" />
      <Panel label="paper" variant="paper" title="Read it later, offline" body="Saved articles wait on every device you own." action="Save this page" />
      <Panel label="tint" variant="tint" title="Team plan, two months free" body="Billed yearly. Cancel any time before renewal." action="Compare plans" />
      <Panel label="speckle" variant="speckle" title="A card for the whole office" body="Everyone signs it from their own phone." action="Pick a card" />
    </div>
  )
}
