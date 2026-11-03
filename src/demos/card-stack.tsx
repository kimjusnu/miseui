import type * as React from "react"
import { useMemo, useState } from "react"
import { Bell, CreditCard, FileText, Pause, Play, UserPlus } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { CardStack, type CardStackItem } from "@/registry/miseui/ui/card-stack"

const SCENES = [
  "linear-gradient(160deg, #b9cfe0, #e9e3d6 70%)",
  "linear-gradient(160deg, #d7c9b4, #efe6d6 70%)",
  "linear-gradient(160deg, #b8cdb9, #e4e6d4 70%)",
  "linear-gradient(160deg, #cdbdcf, #ece2e6 70%)",
]

function Place({ name, detail, scene }: { name: string; detail: string; scene: string }) {
  return (
    <div className="grid gap-3">
      <div aria-hidden="true" className="aspect-[2/1] rounded-lg" style={{ backgroundImage: scene }} />
      <div className="min-w-0">
        <p className="text-[15px] font-medium">{name}</p>
        <p className="text-[13px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

const PLACES: readonly CardStackItem[] = [
  { id: "lake", label: "Alpine lake", content: <Place name="Alpine lake" detail="Two hours from the station" scene={SCENES[0] as string} /> },
  { id: "cabin", label: "Cedar cabin", content: <Place name="Cedar cabin" detail="Sleeps four, wood stove" scene={SCENES[1] as string} /> },
  { id: "trail", label: "Ridge trail", content: <Place name="Ridge trail" detail="Eleven kilometres, one climb" scene={SCENES[2] as string} /> },
  { id: "market", label: "Harbour market", content: <Place name="Harbour market" detail="Saturdays until noon" scene={SCENES[3] as string} /> },
]

function Plan({ name, price, detail }: { name: string; price: string; detail: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-[13px] text-muted-foreground">{name}</p>
      <p className="text-[15px] font-medium tabular-nums">{price}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

const PLANS: readonly CardStackItem[] = [
  { id: "free", label: "Free plan", content: <Plan name="Free" price="$0" detail="One project" /> },
  { id: "team", label: "Team plan", content: <Plan name="Team" price="$12 a seat" detail="Shared projects" /> },
  { id: "scale", label: "Scale plan", content: <Plan name="Scale" price="$40 a seat" detail="Audit log and SSO" /> },
]

const DRAFTS: readonly CardStackItem[] = [
  { id: "launch", label: "Launch note", content: <Place name="Launch note" detail="Three paragraphs, ready to send" scene={SCENES[0] as string} /> },
  { id: "pricing", label: "Pricing change", content: <Place name="Pricing change" detail="Needs a second reader" scene={SCENES[3] as string} /> },
  { id: "survey", label: "Customer survey", content: <Place name="Customer survey" detail="Twelve questions" scene={SCENES[2] as string} /> },
]

function Update({ icon, title, when }: { icon: React.ReactNode; title: string; when: string }) {
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{when}</p>
      </div>
    </div>
  )
}

const UPDATES: readonly CardStackItem[] = [
  { id: "invite", label: "Mina accepted your invite", content: <Update icon={<UserPlus />} title="Mina accepted your invite" when="2 minutes ago" /> },
  { id: "invoice", label: "Invoice paid", content: <Update icon={<CreditCard />} title="Invoice paid" when="1 hour ago" /> },
  { id: "doc", label: "Brief was edited", content: <Update icon={<FileText />} title="Brief was edited" when="3 hours ago" /> },
  { id: "reminder", label: "Review is due", content: <Update icon={<Bell />} title="Review is due" when="Tomorrow" /> },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function SwipeCell() {
  const [last, setLast] = useState<string | null>(null)
  const names = useMemo(() => new Map(DRAFTS.map((draft) => [draft.id, draft.label])), [])
  return (
    <Cell label={last ?? "swipe: drag left or right, or use the buttons"}>
      <CardStack label="Review drafts" variant="swipe" items={DRAFTS} onDecide={(id, choice) => setLast(`swipe: ${names.get(id)} went ${choice}`)} />
    </Cell>
  )
}

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Resume autoplay" : "Pause autoplay"}
        </Button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Cell label="pile: drag the top away or press Next">
          <CardStack label="Saved places" items={PLACES} />
        </Cell>
        <Cell label="fan: hover, focus or tap">
          <CardStack label="Plans" variant="fan" items={PLANS} />
        </Cell>
        <SwipeCell />
        <Cell label="cascade: press or focus, and it floats over what follows">
          <CardStack label="Notifications" variant="cascade" items={UPDATES} />
        </Cell>
        <Cell label="pile, autoplay effect: stops on hover and focus">
          <CardStack label="Saved places, turning by themselves" effect="autoplay" items={PLACES} paused={paused} seed={4} />
        </Cell>
      </div>
    </div>
  )
}
