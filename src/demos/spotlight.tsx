import { Spotlight, SpotlightGroup } from "@/registry/miseui/ui/spotlight"

const CARDS = [
  { title: "Analytics", body: "See which pages people leave from." },
  { title: "Billing", body: "Invoices and seats in one place." },
  { title: "Support", body: "Every reply within one working day." },
] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Body({ title, body }: { title: string; body: string }) {
  return (
    <>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="glow">
        <Spotlight className="p-4">
          <Body title="Team plan" body="Shared projects, roles and an audit log for the whole company." />
        </Spotlight>
      </Cell>
      <Cell label="border">
        <Spotlight variant="border" className="p-4">
          <Body title="Usage this month" body="1,284 of 5,000 requests. Resets on the first." />
        </Spotlight>
      </Cell>
      <Cell label="reveal, a grid under the pointer">
        <Spotlight variant="reveal" className="p-4">
          <Body title="Nothing here yet" body="Create a board and it shows up in this space." />
        </Spotlight>
      </Cell>
      <Cell label="trail effect">
        <Spotlight effect="trail" className="p-4">
          <Body title="Move across this card" body="The light lags a little behind the pointer." />
        </Spotlight>
      </Cell>
      <div className="sm:col-span-2">
        <Cell label="group, one light across several cards">
          <SpotlightGroup className="grid gap-2 sm:grid-cols-3">
            {CARDS.map((card) => (
              <Spotlight key={card.title} variant="border" className="p-4">
                <Body title={card.title} body={card.body} />
              </Spotlight>
            ))}
          </SpotlightGroup>
        </Cell>
      </div>
    </div>
  )
}
