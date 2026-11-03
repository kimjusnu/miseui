import { Clipboard } from "@/registry/miseui/ui/clipboard"
import { DescriptionItem, DescriptionList, type DescriptionListVariant } from "@/registry/miseui/ui/description-list"

const WEBHOOK = "https://hooks.harbourfreight.dev/orders/2041/deliveries/signed?token=a91f03c7be44d2"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Invoice({ variant }: { variant: DescriptionListVariant }) {
  return (
    <DescriptionList variant={variant}>
      <DescriptionItem label="Invoice" action={<Clipboard value="INV-2041" label="Copy invoice number" />}>
        INV-2041
      </DescriptionItem>
      <DescriptionItem label="Billed to">Mina Park</DescriptionItem>
      <DescriptionItem label="Issued">3 Nov 2026</DescriptionItem>
      <DescriptionItem label="Due">17 Nov 2026</DescriptionItem>
    </DescriptionList>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="stacked, with a copy action">
        <Invoice variant="stacked" />
      </Cell>
      <Cell label="columns">
        <Invoice variant="columns" />
      </Cell>
      <Cell label="inline, as a receipt">
        <DescriptionList variant="inline">
          <DescriptionItem label="Team plan, 6 seats">$72.00</DescriptionItem>
          <DescriptionItem label="Extra storage">$8.00</DescriptionItem>
          <DescriptionItem label="Discount">-$10.00</DescriptionItem>
          <DescriptionItem label="Total" className="border-t pt-2 font-medium">
            $70.00
          </DescriptionItem>
        </DescriptionList>
      </Cell>
      <Cell label="card">
        <DescriptionList variant="card">
          <DescriptionItem label="Uptime">99.98%</DescriptionItem>
          <DescriptionItem label="Region">Seoul</DescriptionItem>
          <DescriptionItem label="Plan">Team</DescriptionItem>
        </DescriptionList>
      </Cell>
      <Cell label="a long value wraps">
        <DescriptionList variant="stacked">
          <DescriptionItem label="Webhook" action={<Clipboard value={WEBHOOK} label="Copy webhook address" />}>
            <span className="font-mono text-[13px]">{WEBHOOK}</span>
          </DescriptionItem>
          <DescriptionItem label="Last delivery">Today at 09:12, status 200</DescriptionItem>
        </DescriptionList>
      </Cell>
      <Cell label="a long value wraps, inline">
        <DescriptionList variant="inline">
          <DescriptionItem label="Ship to">Unit 1206, 22 Harbour Road, Gyeyang District, Incheon</DescriptionItem>
          <DescriptionItem label="Carrier">Hanjin</DescriptionItem>
        </DescriptionList>
      </Cell>
    </div>
  )
}
