import { useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import type { SettingsDangerRow } from "./settings-page-form"
import { RESPONSIVE_ROW_CLASS, RowText } from "./settings-page-row-text"

function DangerDone({ row, onUndo }: { row: SettingsDangerRow; onUndo: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role="status" className="text-[13px] text-pretty text-muted-foreground">
        {row.doneMessage}
      </p>
      <Button variant="outline" size="sm" onClick={onUndo}>
        Undo
      </Button>
    </div>
  )
}

function DangerControls({ row }: { row: SettingsDangerRow }) {
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle")
  if (step === "done") {
    const undo = () => {
      setStep("idle")
      row.onUndo?.()
    }
    return <DangerDone row={row} onUndo={undo} />
  }
  if (step === "confirm") {
    const confirm = () => {
      setStep("done")
      row.onConfirm?.()
    }
    return (
      <div className="flex flex-wrap gap-2">
        {/* Focus lands on the safe choice, so a second press of Enter cannot confirm by accident. */}
        <Button variant="outline" size="sm" autoFocus onClick={() => setStep("idle")}>
          {row.cancelLabel}
        </Button>
        <Button variant="destructive" size="sm" onClick={confirm}>
          {row.confirmLabel}
        </Button>
      </div>
    )
  }
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setStep("confirm")}
    >
      {row.actionLabel}
    </Button>
  )
}

function DangerRow({ row, fieldId }: { row: SettingsDangerRow; fieldId: string }) {
  return (
    <div className={cn(RESPONSIVE_ROW_CLASS, "@2xl:items-center")}>
      <RowText row={row} fieldId={fieldId} />
      <div className="flex min-w-0 @2xl:justify-end">
        <DangerControls row={row} />
      </div>
    </div>
  )
}

export { DangerRow }
