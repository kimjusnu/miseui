import { useId, useMemo } from "react"
import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { isEditable, useSettingsForm, type OnSave, type SettingsSection, type SettingsViewProps } from "./settings-page-form"
import { SETTINGS_TOUCH_CLASS, SettingsRowView } from "./settings-page-parts"
import { SAMPLE_SECTIONS } from "./settings-page-sample"
import { saveBarMessage, SOFT_SHADOW_CLASS } from "./settings-page-savebar"

interface CardFooterProps {
  title: string
  form: ReturnType<typeof useSettingsForm>
  onSave: () => void
}

function CardFooter({ title, form, onSave }: CardFooterProps) {
  const changed = form.changedIds.length > 0
  const errorCount = Object.keys(form.errors).length
  const saving = form.status === "saving"
  const problem = form.status === "failed" || errorCount > 0
  const idle = !changed && form.status === "idle"
  const unavailable = !changed || saving
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t bg-muted/40 p-3 pl-4 @2xl:pl-6 dark:bg-transparent">
      <p role="status" className={cn("flex items-center gap-2 text-[13px]", problem ? "text-destructive" : "text-muted-foreground")}>
        {form.status === "saved" ? <Check aria-hidden="true" className="size-4" /> : null}
        {problem ? <CircleAlert aria-hidden="true" className="size-4" /> : null}
        {idle ? "Up to date" : saveBarMessage({ status: form.status, changedCount: form.changedIds.length, errorCount })}
      </p>
      <div className="ml-auto flex gap-2">
        {changed && !saving ? (
          <Button variant="ghost" className="pointer-coarse:h-10" onClick={form.discard}>
            Discard
          </Button>
        ) : null}
        {/* aria-disabled, not disabled: the button stays in place after a save, and a disabled one would drop keyboard focus. */}
        <Button
          variant={changed ? "mise" : "outline"}
          aria-label={`Save ${title}`}
          aria-disabled={unavailable || undefined}
          effect={saving ? "shimmer" : undefined}
          onClick={unavailable ? undefined : onSave}
          className={cn("pointer-coarse:h-10", !changed && "opacity-50 hover:bg-background")}
        >
          {saving ? "Saving" : "Save"}
        </Button>
      </div>
    </div>
  )
}

function SettingsCard({ section, onSave }: { section: SettingsSection; onSave?: OnSave }) {
  const baseId = useId()
  const single = useMemo(() => [section], [section])
  const form = useSettingsForm(single, onSave)
  const fieldId = (id: string) => `${baseId}-field-${id}`
  const titleId = `${baseId}-title`
  const danger = section.tone === "danger"

  const save = async () => {
    const firstInvalid = await form.save()
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  return (
    <section aria-labelledby={titleId} className={cn("@container rounded-2xl border bg-background dark:bg-card", danger ? "mt-4 border-destructive/40" : SOFT_SHADOW_CLASS)}>
      <header className="flex flex-col gap-1 p-4 @2xl:px-6 @2xl:pt-6">
        <h3 id={titleId} className="text-title text-lg">
          {section.title}
        </h3>
        {section.description ? <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">{section.description}</p> : null}
      </header>
      <div className="flex flex-col divide-y border-t">
        {section.rows.map((row) => (
          <SettingsRowView
            key={row.id}
            row={row}
            fieldId={fieldId(row.id)}
            value={form.values[row.id]}
            error={form.errors[row.id]}
            onChange={(value) => form.update(row.id, value)}
            onBlur={() => form.touch(row.id)}
          />
        ))}
      </div>
      {/* Read-only and destructive rows act on their own, so a group of only those has nothing to save. */}
      {section.rows.some(isEditable) ? <CardFooter title={section.title} form={form} onSave={save} /> : null}
    </section>
  )
}

function SettingsCardsView({ title = "Settings.", titleQuiet = "Each group saves on its own.", sections = SAMPLE_SECTIONS, onSave, className, ...props }: SettingsViewProps) {
  return (
    <div data-slot="settings-page" data-variant="cards" className={cn("@container w-full bg-muted dark:bg-background", SETTINGS_TOUCH_CLASS, className)} {...props}>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 @2xl:gap-12 @2xl:px-8 @2xl:py-12">
        <h2 className="text-display text-3xl text-balance @2xl:text-4xl">
          {title} {titleQuiet ? <span className="text-muted-foreground">{titleQuiet}</span> : null}
        </h2>
        <div className="flex min-w-0 flex-col gap-6">
          {sections.map((section) => (
            <SettingsCard key={section.id} section={section} onSave={onSave} />
          ))}
        </div>
      </div>
    </div>
  )
}

export { SettingsCardsView }
