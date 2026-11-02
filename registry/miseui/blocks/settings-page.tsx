import type * as React from "react"
import { useId, useState } from "react"
import { useReducedMotion } from "motion/react"
import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Materialize } from "@/registry/miseui/ui/materialize"
import { useSettingsForm, type OnSave, type SaveStatus, type SettingsSection, type SettingsValues } from "./settings-page-form"
import { SettingsRowView } from "./settings-page-parts"
import { SAMPLE_SECTIONS } from "./settings-page-sample"

/** Tinted from the ink, and off in dark mode, where a light-tinted shadow would read as a glow. */
const SOFT_SHADOW_CLASS =
  "shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"

interface SectionNavProps {
  sections: readonly SettingsSection[]
  active: string
  onSelect: (id: string) => void
}

function SectionNav({ sections, active, onSelect }: SectionNavProps) {
  return (
    <nav aria-label="Settings sections" className="min-w-0 @3xl:sticky @3xl:top-8 @3xl:self-start">
      <ul className="flex gap-1 overflow-x-auto @3xl:flex-col @3xl:overflow-visible">
        {sections.map((section) => (
          <li key={section.id} className={cn("shrink-0", section.tone === "danger" && "@3xl:mt-4")}>
            <button
              type="button"
              aria-current={section.id === active ? "true" : undefined}
              onClick={() => onSelect(section.id)}
              className={cn(
                "inline-flex h-9 w-full items-center rounded-md px-3 text-[13px] whitespace-nowrap outline-none",
                "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
                "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
                section.id === active ? "bg-background dark:bg-card text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/60",
              )}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

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

function SectionBlock({ section, anchorId, children }: { section: SettingsSection; anchorId: string; children: React.ReactNode }) {
  const danger = section.tone === "danger"
  return (
    <section id={anchorId} aria-labelledby={`${anchorId}-title`} className={cn("flex scroll-mt-8 flex-col gap-4", danger && "mt-4 border-t pt-12")}>
      {/* Inline, so one tone-split sentence reads as a single thought while the heading stays a real heading. */}
      <div className="text-[15px] leading-relaxed text-pretty">
        <h3 id={`${anchorId}-title`} className="inline font-medium">
          {section.title}
        </h3>
        {section.description ? (
          <>
            <span aria-hidden="true">. </span>
            <p className="inline text-muted-foreground">{section.description}</p>
          </>
        ) : null}
      </div>
      <div className={cn("flex flex-col divide-y rounded-2xl border bg-background dark:bg-card", danger ? "border-destructive/40" : SOFT_SHADOW_CLASS)}>{children}</div>
    </section>
  )
}

interface SectionListProps {
  sections: readonly SettingsSection[]
  form: ReturnType<typeof useSettingsForm>
  fieldId: (id: string) => string
  anchorId: (id: string) => string
}

function SectionList({ sections, form, fieldId, anchorId }: SectionListProps) {
  return sections.map((section) => (
    <SectionBlock key={section.id} section={section} anchorId={anchorId(section.id)}>
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
    </SectionBlock>
  ))
}

interface SettingsPageProps extends Omit<React.ComponentProps<"div">, "title"> {
  title?: string
  /** Continues the title in the same size, one tone quieter. */
  titleQuiet?: string
  sections?: readonly SettingsSection[]
  /** Receives every editable value and the ids that changed. Reject to keep the edits on screen and offer a retry. */
  onSave?: OnSave
}

function SettingsPage({ title = "Settings.", titleQuiet = "Nothing changes until you save.", sections = SAMPLE_SECTIONS, onSave, className, ...props }: SettingsPageProps) {
  const baseId = useId()
  const reduceMotion = useReducedMotion()
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "")
  const form = useSettingsForm(sections, onSave)
  const fieldId = (id: string) => `${baseId}-field-${id}`
  const anchorId = (id: string) => `${baseId}-section-${id}`
  const errorCount = Object.keys(form.errors).length
  const barVisible = form.changedIds.length > 0 || form.status === "saved" || form.status === "saving"

  const goToSection = (id: string) => {
    setActiveSection(id)
    document.getElementById(anchorId(id))?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  }
  const save = async () => {
    const firstInvalid = await form.save()
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  return (
    <div data-slot="settings-page" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 @2xl:gap-12 @2xl:px-8 @2xl:py-12">
        <h2 className="text-display text-3xl text-balance @2xl:text-4xl">
          {title} {titleQuiet ? <span className="text-muted-foreground">{titleQuiet}</span> : null}
        </h2>
        <div className="grid min-w-0 gap-8 @3xl:grid-cols-[176px_minmax(0,1fr)] @3xl:gap-12">
          <SectionNav sections={sections} active={activeSection} onSelect={goToSection} />
          <div className="flex min-w-0 flex-col gap-12">
            <SectionList sections={sections} form={form} fieldId={fieldId} anchorId={anchorId} />
            {/* Stays in the flow and sticks: it never covers the last row, and it follows a long page. */}
            <Materialize show={barVisible} origin="50% 100%" className="sticky bottom-4 z-10">
              <SaveBar
                status={form.status}
                changedCount={form.changedIds.length}
                errorCount={errorCount}
                onDiscard={form.discard}
                onSave={save}
              />
            </Materialize>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsPage, type SettingsPageProps, type SettingsSection, type SettingsValues }
