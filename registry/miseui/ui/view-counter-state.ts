import { useEffect, useRef, useState } from "react"

export type ViewCountFetcher = (signal: AbortSignal) => Promise<number>

type CountState =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "failed" }

interface Settled {
  key: string
  attempt: number
  state: CountState
}

const LOADING: CountState = { status: "loading" }

/** The answer comes from someone else's server, so its shape is checked before it reaches the screen. */
export function readCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("View count must be a non-negative number")
  return value
}

/**
 * The fetcher is kept in a ref so an inline arrow function does not refetch on every parent render,
 * which on a counter that increments would count one reader many times. Only `resourceKey` and a retry run it again.
 */
export function useViewCount(fetcher: ViewCountFetcher, resourceKey: string, onError?: (error: unknown) => void) {
  const fetcherRef = useRef(fetcher)
  const onErrorRef = useRef(onError)
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    fetcherRef.current = fetcher
    onErrorRef.current = onError
  })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    // Started from a resolved promise so a fetcher that throws straight away lands in the same catch.
    Promise.resolve()
      .then(() => fetcherRef.current(signal))
      .then((value) => {
        if (!signal.aborted) setSettled({ key: resourceKey, attempt, state: { status: "ready", value: readCount(value) } })
      })
      .catch((error: unknown) => {
        if (signal.aborted) return
        setSettled({ key: resourceKey, attempt, state: { status: "failed" } })
        onErrorRef.current?.(error)
      })
    return () => controller.abort()
  }, [resourceKey, attempt])

  // Derived rather than reset in the effect: an answer for an older key or attempt simply does not count.
  const current = settled && settled.key === resourceKey && settled.attempt === attempt ? settled.state : LOADING
  return { state: current, retry: () => setAttempt((count) => count + 1) }
}

export function formatCount(value: number, locale: string | undefined, compact: boolean) {
  return new Intl.NumberFormat(locale, compact ? { notation: "compact" } : undefined).format(value)
}

export function defaultViewLabel(count: number) {
  return count === 1 ? "view" : "views"
}
