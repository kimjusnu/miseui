import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/miseui/ui/select"
import { Switch } from "@/registry/miseui/ui/switch"
import { DangerRow } from "./settings-page-danger"
import { descriptionId, RESPONSIVE_ROW_CLASS, RowText } from "./settings-page-row-text"
import type {
  SettingsInfoRow,
  SettingsRow,
  SettingsSelectRow,
  SettingsSwitchRow,
  SettingsTextRow,
  SettingsValue,
} from "./settings-page-form"

const ROW_CLASS = RESPONSIVE_ROW_CLASS
const errorId = (id: string) => `${id}-error`

interface FieldProps<Row> {
  row: Row
  fieldId: string
  value: SettingsValue
  error?: string
  onChange: (value: SettingsValue) => void
  onBlur: () => void
}

function TextRow({ row, fieldId, value, error, onChange, onBlur }: FieldProps<SettingsTextRow>) {
  const described = [row.description && descriptionId(fieldId), error && errorId(fieldId)].filter(Boolean).join(" ")
  return (
    <div className={ROW_CLASS}>
      <RowText row={row} htmlFor={fieldId} fieldId={fieldId} />
      <div className="min-w-0">
        <Input
          id={fieldId}
          type={row.type ?? "text"}
          autoComplete={row.autoComplete}
          value={String(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={described || undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {error ? (
          <p id={errorId(fieldId)} className="mt-2 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SelectRow({ row, fieldId, value, onChange }: FieldProps<SettingsSelectRow>) {
  return (
    <div className={ROW_CLASS}>
      <RowText row={row} htmlFor={fieldId} fieldId={fieldId} />
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger
          id={fieldId}
          aria-describedby={row.description ? descriptionId(fieldId) : undefined}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {row.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** The one row that stays side by side when narrow: a switch alone on its own line reads as detached from its label. */
function SwitchRow({ row, fieldId, value, onChange }: FieldProps<SettingsSwitchRow>) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 @2xl:gap-8 @2xl:px-6">
      <RowText row={row} htmlFor={fieldId} fieldId={fieldId} />
      <Switch
        id={fieldId}
        checked={Boolean(value)}
        aria-describedby={row.description ? descriptionId(fieldId) : undefined}
        onCheckedChange={onChange}
      />
    </div>
  )
}

function InfoRow({ row, fieldId }: { row: SettingsInfoRow; fieldId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 @2xl:gap-8 @2xl:px-6">
      <RowText row={row} fieldId={fieldId} />
      <div className="flex shrink-0 items-center gap-4">
        {row.value ? <span className="text-[13px] text-muted-foreground">{row.value}</span> : null}
        {row.actionLabel ? (
          <Button variant="outline" size="sm" onClick={row.onAction}>
            {row.actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

interface SettingsRowViewProps {
  row: SettingsRow
  fieldId: string
  value: SettingsValue | undefined
  error?: string
  onChange: (value: SettingsValue) => void
  onBlur: () => void
}

function SettingsRowView({ row, fieldId, value, error, onChange, onBlur }: SettingsRowViewProps) {
  if (row.kind === "info") return <InfoRow row={row} fieldId={fieldId} />
  if (row.kind === "danger") return <DangerRow row={row} fieldId={fieldId} />
  const field = { fieldId, value: value ?? row.value, error, onChange, onBlur }
  if (row.kind === "text") return <TextRow row={row} {...field} />
  if (row.kind === "select") return <SelectRow row={row} {...field} />
  return <SwitchRow row={row} {...field} />
}

export { SettingsRowView }
