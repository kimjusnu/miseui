import type * as React from "react"
import { Cascader, type CascaderOption, type LoadChildren } from "@/registry/miseui/ui/cascader"

const FAKE_FETCH_MS = 900

const OFFICES: readonly CascaderOption[] = [
  {
    value: "asia",
    label: "Asia",
    children: [
      {
        value: "korea",
        label: "South Korea",
        children: [
          { value: "seoul", label: "Seoul" },
          { value: "busan", label: "Busan" },
          { value: "incheon", label: "Incheon" },
        ],
      },
      {
        value: "japan",
        label: "Japan",
        children: [
          { value: "tokyo", label: "Tokyo" },
          { value: "osaka", label: "Osaka" },
        ],
      },
      { value: "singapore", label: "Singapore", disabled: true },
    ],
  },
  {
    value: "europe",
    label: "Europe",
    children: [
      {
        value: "germany",
        label: "Germany",
        children: [
          { value: "berlin", label: "Berlin" },
          { value: "munich", label: "Munich" },
        ],
      },
      {
        value: "portugal",
        label: "Portugal",
        children: [{ value: "lisbon", label: "Lisbon" }],
      },
    ],
  },
  {
    value: "americas",
    label: "Americas",
    children: [
      { value: "toronto", label: "Toronto" },
      { value: "bogota", label: "Bogota" },
    ],
  },
]

const LAZY_ROOT: readonly CascaderOption[] = [
  { value: "docs", label: "Documents", lazy: true },
  { value: "media", label: "Media", lazy: true },
]

const LAZY_CHILDREN: Readonly<Record<string, readonly CascaderOption[]>> = {
  docs: [
    { value: "contracts", label: "Contracts" },
    { value: "invoices", label: "Invoices" },
  ],
  media: [
    { value: "photos", label: "Photos" },
    { value: "videos", label: "Videos" },
  ],
}

/** Stands in for a real request, so the demo shows the waiting state. */
const loadChildren: LoadChildren = (path) =>
  new Promise((resolve) => setTimeout(() => resolve(LAZY_CHILDREN[path[path.length - 1]] ?? []), FAKE_FETCH_MS))

function Cell({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "grid min-w-0 content-start gap-2 sm:col-span-2" : "grid min-w-0 content-start gap-2"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <Cascader aria-label="Office" placeholder="Choose an office" options={OFFICES} defaultValue={["asia", "korea", "seoul"]} />
      </Cell>
      <Cell label="compact">
        <Cascader variant="compact" aria-label="Office, compact" placeholder="Office" options={OFFICES} />
      </Cell>
      <Cell label="multiple, a parent box ticks everything under it">
        <Cascader variant="multiple" aria-label="Regions" placeholder="Choose regions" options={OFFICES} defaultValue={[["asia", "japan", "tokyo"], ["europe", "portugal", "lisbon"]]} />
      </Cell>
      <Cell label="lazy children, loaded on first open">
        <Cascader aria-label="Folder" placeholder="Choose a folder" options={LAZY_ROOT} loadChildren={loadChildren} searchable={false} />
      </Cell>
      <Cell label="inline, steps by itself when its column is narrow" wide>
        <Cascader variant="inline" aria-label="Office, inline" options={OFFICES} defaultValue={["europe", "germany", "berlin"]} />
      </Cell>
      <Cell label="slide effect, stepping between levels" wide>
        <div className="min-w-0 max-w-sm">
          <Cascader variant="inline" effect="slide" layout="steps" aria-label="Office, stepped" options={OFFICES} />
        </div>
      </Cell>
    </div>
  )
}
