import { useState } from "react"
import { BellOff, FolderPlus, Receipt, SearchX } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Empty } from "@/registry/miseui/ui/empty"
import { Input } from "@/registry/miseui/ui/input"

const CITIES = ["Lisbon", "Seoul", "Oslo", "Lima", "Porto"] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function CitySearch() {
  const [query, setQuery] = useState("xyz")
  const matches = CITIES.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <div className="grid gap-2">
      <Input value={query} aria-label="Search cities" placeholder="Search cities" onChange={(event) => setQuery(event.target.value)} />
      {matches.length > 0 ? (
        <ul className="grid gap-1 px-3 py-2 text-sm">
          {matches.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      ) : (
        <Empty
          effect="materialize"
          announce
          variant="compact"
          icon={<SearchX />}
          title="No matching cities"
          actions={
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              Clear
            </Button>
          }
        />
      )}
    </div>
  )
}

function InvoiceActions() {
  return (
    <>
      <Button size="sm">Create invoice</Button>
      <Button variant="ghost" size="sm">
        Import
      </Button>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <Empty
          icon={<SearchX />}
          title="No results for refund policy"
          description="Check the spelling or try a shorter search."
          actions={<Button variant="outline" size="sm">Clear search</Button>}
        />
      </Cell>
      <Cell label="dashed">
        <Empty
          variant="dashed"
          icon={<FolderPlus />}
          title="No files in this project"
          description="Add a file to share it with your team."
          actions={<Button size="sm">Upload file</Button>}
        />
      </Cell>
      <Cell label="card">
        <Empty
          variant="card"
          icon={<Receipt />}
          title="No invoices yet"
          description="Invoices appear here once a customer pays."
          actions={<InvoiceActions />}
        />
      </Cell>
      <Cell label="compact">
        <div className="rounded-lg border">
          <Empty variant="compact" icon={<BellOff />} title="No new notifications" description="You are all caught up." />
        </div>
      </Cell>
      <Cell label="materialize effect, type to filter">
        <CitySearch />
      </Cell>
    </div>
  )
}
