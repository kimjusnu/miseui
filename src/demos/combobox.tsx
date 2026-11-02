import type * as React from "react"
import { useEffect, useState } from "react"
import { Combobox, type ComboboxEffect, type ComboboxOption } from "@/registry/miseui/ui/combobox"

const EFFECTS: readonly ComboboxEffect[] = ["spring", "materialize"]
/** Long enough to see the loading row, short enough not to feel broken. */
const FAKE_LATENCY_MS = 600

const initials = (name: string) => (
  <span className="text-[13px] font-medium text-muted-foreground">
    {name
      .split(" ")
      .map((part) => part[0])
      .join("")}
  </span>
)

const PEOPLE: readonly ComboboxOption[] = [
  { value: "hana", label: "Hana Lim", description: "Product design", media: initials("Hana Lim") },
  { value: "marco", label: "Marco Ruiz", description: "Backend", media: initials("Marco Ruiz") },
  { value: "priya", label: "Priya Nair", description: "Support lead", media: initials("Priya Nair") },
  { value: "tom", label: "Tom Becker", description: "On leave until Monday", media: initials("Tom Becker"), disabled: true },
]

const ZONES: readonly ComboboxOption[] = [
  { value: "seoul", label: "Seoul", group: "Asia" },
  { value: "tokyo", label: "Tokyo", group: "Asia" },
  { value: "singapore", label: "Singapore", group: "Asia" },
  { value: "london", label: "London", group: "Europe" },
  { value: "berlin", label: "Berlin", group: "Europe" },
  { value: "new-york", label: "New York", group: "Americas" },
  { value: "sao-paulo", label: "Sao Paulo", group: "Americas" },
]

const LABELS: readonly ComboboxOption[] = [
  { value: "bug", label: "Bug" },
  { value: "billing", label: "Billing" },
  { value: "design", label: "Design" },
  { value: "docs", label: "Docs" },
  { value: "urgent", label: "Urgent" },
]

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

/** Stands in for a request: results arrive late, and only the query that is still current is applied. */
function AsyncDemo() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState(ZONES)
  const [settled, setSettled] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(ZONES.filter((zone) => zone.label.toLowerCase().includes(query.toLowerCase())))
      setSettled(query)
    }, FAKE_LATENCY_MS)
    return () => clearTimeout(timer)
  }, [query])
  return (
    <Combobox
      aria-label="City, searched on a server"
      placeholder="Search cities"
      options={results}
      loading={query !== settled}
      loadingText="Searching cities"
      emptyText="No city by that name."
      onSearch={setQuery}
    />
  )
}

export function Demo() {
  return (
    <div className="grid w-full max-w-sm min-w-0 gap-6">
      <Labelled title="plain">
        <Combobox aria-label="Label" placeholder="Pick a label" options={LABELS} defaultValue="design" />
      </Labelled>
      <Labelled title="avatar">
        <Combobox aria-label="Assignee" variant="avatar" placeholder="Assign someone" options={PEOPLE} />
      </Labelled>
      <Labelled title="grouped">
        <Combobox aria-label="Time zone" variant="grouped" placeholder="Pick a city" options={ZONES} />
      </Labelled>
      <Labelled title="tags, multiple">
        <Combobox aria-label="Labels" variant="tags" multiple placeholder="Add label" options={LABELS} defaultValue={["bug", "urgent"]} />
      </Labelled>
      {EFFECTS.map((effect) => (
        <Labelled key={effect} title={`${effect} effect`}>
          <Combobox aria-label={`Reviewer, ${effect}`} variant="avatar" effect={effect} placeholder="Pick a reviewer" options={PEOPLE} />
        </Labelled>
      ))}
      <Labelled title="loading and empty, async with onSearch">
        <AsyncDemo />
      </Labelled>
    </div>
  )
}
