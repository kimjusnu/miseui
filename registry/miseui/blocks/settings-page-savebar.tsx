import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import type { SaveStatus } from "./settings-page-form"

/** Tinted from the ink, and off in dark mode, where a light-tinted shadow would read as a glow. */
const SOFT_SHADOW_CLASS =
  "shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"

interface SaveBarProps {
  status: SaveStatus
  changedCount: number
  errorCount: number
  onDiscard: () => void
  onSave: () => void
}

function saveBarMessage({ status, changedCount, errorCount }: Omit<SaveBarProps, "onDiscard" | "onSave">) {
  if (status === "saved") return "Changes saved"
  if (status === "failed") return "Could not save. Your changes are still here."
  if (errorCount > 0) return errorCount === 1 ? "Fix 1 field to save" : `Fix ${errorCount} fields to save`
  return changedCount === 1 ? "1 unsaved change" : `${changedCount} unsaved changes`
}

function SaveBar({ status, changedCount, errorCount, onDiscard, onSave }: SaveBarProps) {
  const saving = status === "saving"
  const problem = status === "failed" || errorCount > 0
  return (
    <div className="material flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 pl-4 shadow-md">
      <p role="status" className={cn("flex items-center gap-2 text-[13px]", problem && "text-destructive")}>
        {status === "saved" ? <Check aria-hidden="true" className="size-4" /> : null}
        {problem ? <CircleAlert aria-hidden="true" className="size-4" /> : null}
        {saveBarMessage({ status, changedCount, errorCount })}
      </p>
      {status === "saved" ? null : (
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" disabled={saving} onClick={onDiscard}>
            Discard
          </Button>
          <Button variant="mise" disabled={saving} effect={saving ? "shimmer" : undefined} onClick={onSave}>
            {saving ? "Saving" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  )
}

export { SaveBar, saveBarMessage, SOFT_SHADOW_CLASS }
