import { Button } from "@/registry/miseui/ui/button"
import { PanelStack, type PanelStackPanel } from "@/registry/miseui/ui/panel-stack"
import { StatLine } from "@/registry/miseui/ui/stat-line"

const PANELS: readonly PanelStackPanel[] = [
  {
    title: "Half of new teams never invited anyone",
    kicker: "The problem",
    content: <p>They signed up, looked around alone and left within the week, without once seeing what the product was for.</p>,
  },
  {
    title: "We moved the invite into the first screen",
    kicker: "The approach",
    content: <p>The empty board became a question to a colleague. Nothing else changed, so any difference could only come from this.</p>,
  },
  {
    title: "Two out of three teams now invite someone",
    kicker: "The result",
    content: (
      <StatLine
        items={[
          { label: "Invited on day one", value: 66, from: 48, unit: "%" },
          { label: "Questions about roles", value: 12, from: 40 },
        ]}
      />
    ),
  },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-stretch gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="deck">
        <PanelStack panels={PANELS} label="Case study, deck" />
      </Cell>
      <Cell label="peek, the next panel shows at the edge">
        <PanelStack panels={PANELS} label="Case study, peek" variant="peek" />
      </Cell>
      <Cell label="overlay, the whole screen slides over">
        <div>
          <PanelStack panels={PANELS} label="Case study, overlay" variant="overlay" trigger={<Button variant="outline">Read the case study</Button>} />
        </div>
      </Cell>
      <Cell label="wheel effect, overlay, one gesture one panel">
        <div>
          <PanelStack panels={PANELS} label="Case study, wheel effect" variant="overlay" effect="wheel" trigger={<Button variant="outline">Read with the wheel</Button>} />
        </div>
      </Cell>
    </div>
  )
}
