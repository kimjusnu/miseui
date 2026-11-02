import { useEffect, useMemo, useState } from "react"

type SettingsValue = string | boolean
type SettingsValues = Readonly<Record<string, SettingsValue>>

interface SettingsRowBase {
  id: string
  label: string
  description?: string
}

interface SettingsTextRow extends SettingsRowBase {
  kind: "text"
  value: string
  type?: "text" | "email"
  autoComplete?: string
  /** Return a message to block saving, or undefined when the value is fine. */
  validate?: (value: string) => string | undefined
}

interface SettingsSwitchRow extends SettingsRowBase {
  kind: "switch"
  value: boolean
}

interface SettingsSelectRow extends SettingsRowBase {
  kind: "select"
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
}

/** Read-only, with an optional action that leaves this page: nothing here waits for Save. */
interface SettingsInfoRow extends SettingsRowBase {
  kind: "info"
  value?: string
  actionLabel?: string
  onAction?: () => void
}

/** Asks twice, and offers an undo after, instead of warning once and hoping. */
interface SettingsDangerRow extends SettingsRowBase {
  kind: "danger"
  actionLabel: string
  confirmLabel: string
  cancelLabel: string
  doneMessage: string
  onConfirm?: () => void
  onUndo?: () => void
}

type SettingsRow = SettingsTextRow | SettingsSwitchRow | SettingsSelectRow | SettingsInfoRow | SettingsDangerRow
type EditableRow = SettingsTextRow | SettingsSwitchRow | SettingsSelectRow

interface SettingsSection {
  id: string
  title: string
  description?: string
  /** Pushes the section away from the rest and marks its edge, so it cannot be hit on the way to something else. */
  tone?: "danger"
  rows: readonly SettingsRow[]
}

type SaveStatus = "idle" | "saving" | "saved" | "failed"
type OnSave = (values: SettingsValues, changedIds: readonly string[]) => void | Promise<void>

/** Long enough to read "Changes saved" without looking for it, short enough not to linger. */
const SAVED_MESSAGE_MS = 2400

const isEditable = (row: SettingsRow): row is EditableRow =>
  row.kind === "text" || row.kind === "switch" || row.kind === "select"

function editableRows(sections: readonly SettingsSection[]) {
  return sections.flatMap((section) => section.rows.filter(isEditable))
}

function valuesOf(rows: readonly EditableRow[]): SettingsValues {
  return Object.fromEntries(rows.map((row) => [row.id, row.value]))
}

function errorsOf(rows: readonly EditableRow[], values: SettingsValues): Readonly<Record<string, string>> {
  const entries = rows.flatMap((row) => {
    if (row.kind !== "text" || !row.validate) return []
    const message = row.validate(String(values[row.id] ?? ""))
    return message ? [[row.id, message] as const] : []
  })
  return Object.fromEntries(entries)
}

function useSavedMessage(status: SaveStatus, clear: () => void) {
  useEffect(() => {
    if (status !== "saved") return
    const id = window.setTimeout(clear, SAVED_MESSAGE_MS)
    return () => window.clearTimeout(id)
  }, [status, clear])
}

/** Start values are read once. To reload them from the server, remount with a new `key`. */
function useSettingsForm(sections: readonly SettingsSection[], onSave?: OnSave) {
  const rows = useMemo(() => editableRows(sections), [sections])
  const [baseline, setBaseline] = useState(() => valuesOf(rows))
  const [values, setValues] = useState(baseline)
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [status, setStatus] = useState<SaveStatus>("idle")
  const clearStatus = useMemo(() => () => setStatus("idle"), [])
  useSavedMessage(status, clearStatus)

  const changedIds = rows.filter((row) => values[row.id] !== baseline[row.id]).map((row) => row.id)
  const errors = errorsOf(rows, values)
  const invalidIds = rows.filter((row) => errors[row.id]).map((row) => row.id)

  const update = (id: string, value: SettingsValue) => {
    setValues((current) => ({ ...current, [id]: value }))
    setStatus("idle")
  }
  const touch = (id: string) => setTouched((current) => new Set(current).add(id))
  const discard = () => {
    setValues(baseline)
    setTouched(new Set())
    setStatus("idle")
  }
  /** Resolves to the first invalid row, so the page can move focus to it. */
  const save = async (): Promise<string | undefined> => {
    if (invalidIds.length > 0) {
      setTouched(new Set(invalidIds))
      return invalidIds[0]
    }
    setStatus("saving")
    try {
      await onSave?.(values, changedIds)
      setBaseline(values)
      setTouched(new Set())
      setStatus("saved")
    } catch {
      // Nothing is thrown away: the edits stay on screen, ready for another try.
      setStatus("failed")
    }
    return undefined
  }

  const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([id]) => touched.has(id)))
  return { values, changedIds, errors: visibleErrors, status, update, touch, discard, save }
}

export {
  useSettingsForm,
  type OnSave,
  type SaveStatus,
  type SettingsDangerRow,
  type SettingsInfoRow,
  type SettingsRow,
  type SettingsSection,
  type SettingsSelectRow,
  type SettingsSwitchRow,
  type SettingsTextRow,
  type SettingsValue,
  type SettingsValues,
}
