import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { SearchField, type SearchFieldProps } from "@/registry/miseui/ui/search-field"

const INVOICES = ["Northwind, March retainer", "Harbor Labs, design audit", "Fieldnote, annual licence", "Olive and Rye, catering", "Northwind, April retainer"]
const FAKE_LOOKUP_MS = 700

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function LiveSearch(props: SearchFieldProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )
  const onSearch = (next: string) => {
    if (timer.current !== null) clearTimeout(timer.current)
    if (next === "") {
      setLoading(false)
      setQuery("")
      return
    }
    setLoading(true)
    timer.current = setTimeout(() => {
      setQuery(next)
      setLoading(false)
    }, FAKE_LOOKUP_MS)
  }
  const matches = INVOICES.filter((name) => name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="grid min-w-0 gap-2">
      <SearchField placeholder="Search invoices" loading={loading} onSearch={onSearch} {...props} />
      <p aria-live="polite" className="text-[13px] text-muted-foreground">
        {query === "" ? "Try northwind" : `${matches.length} of ${INVOICES.length} invoices match`}
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, type to search">
        <LiveSearch />
      </Cell>
      <Cell label="pill">
        <SearchField variant="pill" placeholder="Search people" />
      </Cell>
      <Cell label="ghost">
        <SearchField variant="ghost" placeholder="Filter this list" defaultValue="overdue" />
      </Cell>
      <Cell label="large">
        <SearchField variant="large" placeholder="How can we help?" />
      </Cell>
      <Cell label="spinner-swap effect">
        <LiveSearch variant="pill" effect="spinner-swap" />
      </Cell>
      <Cell label="Mod K hint, works anywhere on this page">
        <SearchField shortcut placeholder="Jump to a file" />
      </Cell>
    </div>
  )
}
