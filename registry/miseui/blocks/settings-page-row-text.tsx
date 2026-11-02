import { Label } from "@/registry/miseui/ui/label"
import type { SettingsRow } from "./settings-page-form"

const LABEL_CLASS = "text-[15px] leading-normal font-normal"
const DESCRIPTION_CLASS = "mt-1 text-[13px] leading-relaxed text-pretty text-muted-foreground"
/** Label and description on the left, the control on the right; one above the other when narrow. */
const RESPONSIVE_ROW_CLASS = "grid gap-3 p-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,280px)] @2xl:gap-8 @2xl:px-6"

const descriptionId = (id: string) => `${id}-description`

function RowText({ row, htmlFor, fieldId }: { row: SettingsRow; htmlFor?: string; fieldId: string }) {
  return (
    <div className="min-w-0">
      {htmlFor ? (
        <Label htmlFor={htmlFor} className={LABEL_CLASS}>
          {row.label}
        </Label>
      ) : (
        <p className={LABEL_CLASS}>{row.label}</p>
      )}
      {row.description ? (
        <p id={descriptionId(fieldId)} className={DESCRIPTION_CLASS}>
          {row.description}
        </p>
      ) : null}
    </div>
  )
}

export { descriptionId, RESPONSIVE_ROW_CLASS, RowText }
