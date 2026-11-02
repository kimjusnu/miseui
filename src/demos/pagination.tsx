import { Pagination } from "@/registry/miseui/ui/pagination"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8">
      <Cell label="numbers">
        <Pagination aria-label="Search results" pageCount={12} defaultPage={5} siblings={0} />
      </Cell>
      <Cell label="spring effect">
        <Pagination aria-label="Orders" pageCount={12} defaultPage={2} siblings={0} effect="spring" />
      </Cell>
      <Cell label="simple">
        <Pagination aria-label="Invoices" variant="simple" pageCount={12} defaultPage={3} />
      </Cell>
      <Cell label="dots">
        <Pagination aria-label="Product photos" variant="dots" pageCount={5} defaultPage={2} />
      </Cell>
      <Cell label="dots, spring effect">
        <Pagination aria-label="Onboarding steps" variant="dots" pageCount={5} defaultPage={2} effect="spring" />
      </Cell>
      <Cell label="load-more">
        <Pagination aria-label="Customer list" variant="load-more" itemCount={60} pageSize={24} />
      </Cell>
    </div>
  )
}
