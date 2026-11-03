import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { LoadingOverlay, type LoadingOverlayProps } from "@/registry/miseui/ui/loading-overlay"
import { Button } from "@/registry/miseui/ui/button"

const SLOW_MS = 1600
const FAST_MS = 120

const ORDERS = [
  ["#4821", "Harbor Labs", "$1,240"],
  ["#4820", "Fieldnote", "$380"],
  ["#4819", "Olive and Rye", "$2,015"],
] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Orders() {
  return (
    <ul className="grid">
      {ORDERS.map(([id, customer, total]) => (
        <li key={id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-2 border-b px-3 py-2 text-[13px] leading-5 last:border-b-0">
          <span className="text-muted-foreground tabular-nums">{id}</span>
          <span className="truncate">{customer}</span>
          <span className="tabular-nums">{total}</span>
        </li>
      ))}
    </ul>
  )
}

function useFakeWork() {
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )
  const run = (ms: number) => {
    if (timer.current !== null) clearTimeout(timer.current)
    setLoading(true)
    timer.current = setTimeout(() => setLoading(false), ms)
  }
  return { loading, run }
}

function Example({ fast = false, ...props }: Partial<LoadingOverlayProps> & { fast?: boolean }) {
  const { loading, run } = useFakeWork()
  return (
    <div className="grid min-w-0 justify-items-start gap-2">
      <LoadingOverlay loading={loading} label="Refreshing orders" className="w-full overflow-hidden rounded-md border bg-background" {...props}>
        <Orders />
      </LoadingOverlay>
      <Button variant="outline" size="sm" className="pointer-coarse:h-10" disabled={loading} onClick={() => run(fast ? FAST_MS : SLOW_MS)}>
        {fast ? "Refresh, answers in 120 ms" : "Refresh"}
      </Button>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="spinner">
        <Example variant="spinner" />
      </Cell>
      <Cell label="blur">
        <Example variant="blur" />
      </Cell>
      <Cell label="skeleton">
        <Example variant="skeleton" />
      </Cell>
      <Cell label="bar, content stays readable">
        <Example variant="bar" />
      </Cell>
      <Cell label="fade effect, after the delay">
        <Example variant="blur" effect="fade" />
      </Cell>
      <Cell label="a fast answer never flashes">
        <Example variant="spinner" fast />
      </Cell>
    </div>
  )
}
