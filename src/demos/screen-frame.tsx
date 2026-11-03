import { ScreenFrame } from "@/registry/miseui/ui/screen-frame"

const ORDERS = [
  { id: "1042", who: "Mina Park", total: "$48.00" },
  { id: "1041", who: "Leo Costa", total: "$112.50" },
  { id: "1040", who: "Ana Silva", total: "$19.90" },
] as const

function OrdersScreen() {
  return (
    <div className="grid h-full content-start gap-2 p-3">
      <p className="text-xs font-medium">Orders</p>
      <ul className="grid">
        {ORDERS.map((order) => (
          <li key={order.id} className="flex justify-between gap-2 border-b py-1 text-[11px] leading-4 text-muted-foreground last:border-b-0">
            <span className="min-w-0 truncate">{order.who}</span>
            <span className="tabular-nums">{order.total}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CheckoutScreen() {
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-4">
      <div className="grid gap-1">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">$48.00</p>
        <p className="text-xs leading-4 text-muted-foreground">Delivered by Thursday</p>
      </div>
      <p className="rounded-md bg-mise py-2 text-center text-xs font-medium text-mise-foreground">Pay now</p>
    </div>
  )
}

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
      <Cell label="browser">
        <ScreenFrame url="https://shop.example.com/orders">
          <OrdersScreen />
        </ScreenFrame>
      </Cell>
      <Cell label="phone">
        <ScreenFrame variant="phone" screenClassName="aspect-[9/16]">
          <CheckoutScreen />
        </ScreenFrame>
      </Cell>
      <Cell label="plain">
        <ScreenFrame variant="plain" caption="Three orders waiting to ship">
          <OrdersScreen />
        </ScreenFrame>
      </Cell>
      <Cell label="settle effect">
        <ScreenFrame url="https://shop.example.com/orders" effect="settle">
          <OrdersScreen />
        </ScreenFrame>
      </Cell>
    </div>
  )
}
