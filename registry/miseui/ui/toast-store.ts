export type ToastType = "neutral" | "success" | "error" | "loading"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Reuse an id to update a toast in place, as the promise helper does. */
  id?: string
  description?: string
  action?: ToastAction
  /** Milliseconds on screen. Pass Infinity to keep it until dismissed. */
  duration?: number
  /** Which `<Toaster id>` shows it, when a page has more than one. */
  toaster?: string
}

export interface ToastRecord {
  id: string
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  duration: number
  toaster: string
}

export interface ToastPromiseMessages<T> {
  loading: string
  success: string | ((value: T) => string)
  error: string | ((reason: unknown) => string)
}

export const DEFAULT_TOASTER = "default"

/** Errors stay longer because they usually need reading; loading stays until its work settles. */
const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  neutral: 4000,
  success: 4000,
  error: 6000,
  loading: Number.POSITIVE_INFINITY,
}
/** A toast with a button needs time for someone to reach it. */
const ACTION_MIN_DURATION_MS = 8000

const EMPTY: readonly ToastRecord[] = []

let records: readonly ToastRecord[] = EMPTY
let nextId = 1
const listeners = new Set<() => void>()

function commit(next: readonly ToastRecord[]) {
  records = next
  listeners.forEach((listener) => listener())
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot: () => records,
  getServerSnapshot: () => EMPTY,
}

function resolveDuration(type: ToastType, options: ToastOptions): number {
  if (options.duration !== undefined) return options.duration
  const base = DEFAULT_DURATION_MS[type]
  return options.action ? Math.max(base, ACTION_MIN_DURATION_MS) : base
}

function show(type: ToastType, title: string, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${nextId++}`
  const record: ToastRecord = {
    id,
    type,
    title,
    description: options.description,
    action: options.action,
    duration: resolveDuration(type, options),
    toaster: options.toaster ?? DEFAULT_TOASTER,
  }
  const exists = records.some((entry) => entry.id === id)
  commit(exists ? records.map((entry) => (entry.id === id ? record : entry)) : [record, ...records])
  return id
}

function dismiss(id?: string) {
  commit(id === undefined ? EMPTY : records.filter((entry) => entry.id !== id))
}

function resolveMessage<V>(message: string | ((value: V) => string), value: V): string {
  return typeof message === "function" ? message(value) : message
}

function promiseToast<T>(
  work: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages<T>,
  options: Omit<ToastOptions, "id" | "duration"> = {},
): Promise<T> {
  const pending = typeof work === "function" ? work() : work
  const id = show("loading", messages.loading, options)
  // Both handlers live here, so a rejection shown as a toast does not also surface as an unhandled rejection.
  pending.then(
    (value) => show("success", resolveMessage(messages.success, value), { ...options, id }),
    (reason: unknown) => show("error", resolveMessage(messages.error, reason), { ...options, id }),
  )
  return pending
}

export const toast = Object.assign((title: string, options?: ToastOptions) => show("neutral", title, options), {
  success: (title: string, options?: ToastOptions) => show("success", title, options),
  error: (title: string, options?: ToastOptions) => show("error", title, options),
  loading: (title: string, options?: ToastOptions) => show("loading", title, options),
  promise: promiseToast,
  dismiss,
})
