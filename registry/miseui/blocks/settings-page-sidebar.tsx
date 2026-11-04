import { useId, useState } from "react"
import { flushSync } from "react-dom"
import { cn } from "@/registry/miseui/lib/utils"
import { Materialize } from "@/registry/miseui/ui/materialize"
import { useSettingsForm, type SettingsSection, type SettingsViewProps } from "./settings-page-form"
import { SETTINGS_TOUCH_CLASS, SettingsRowView } from "./settings-page-parts"
import { SAMPLE_SECTIONS } from "./settings-page-sample"
import { SaveBar, SOFT_SHADOW_CLASS } from "./settings-page-savebar"

interface SideNavProps {
  sections: readonly SettingsSection[]
  active: string
  changedIds: readonly string[]
  errorIds: readonly string[]
  onSelect: (id: string) => void
}

function countIn(section: SettingsSection, ids: readonly string[]) {
  return section.rows.filter((row) => ids.includes(row.id)).length
}

/** The count travels with the section, because an edit on a screen that is no longer showing is easy to forget. */
function SideNavItem({ section, active, changed, invalid, onSelect }: { section: SettingsSection; active: boolean; changed: number; invalid: boolean; onSelect: () => void }) {
  const Icon = section.icon
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={changed > 0 ? `${section.title}, ${changed} unsaved` : undefined}
      onClick={onSelect}
      className={cn(
        "inline-flex h-9 w-full items-center gap-3 rounded-md px-3 text-start text-[13px] whitespace-nowrap outline-none pointer-coarse:h-10",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
        "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
        active ? "bg-background text-foreground shadow-xs dark:bg-card" : "text-muted-foreground hover:bg-background/60",
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1">{section.title}</span>
      {changed > 0 ? (
        <span className={cn("shrink-0 tabular-nums", invalid ? "text-destructive" : "text-muted-foreground")}>{changed}</span>
      ) : null}
    </button>
  )
}

function SideNav({ sections, active, changedIds, errorIds, onSelect }: SideNavProps) {
  return (
    <nav aria-label="Settings sections" className="min-w-0">
      {/* A scroller of its own when narrow, so five labels never push the page sideways on a phone. */}
      <ul className="flex gap-1 overflow-x-auto @3xl:flex-col @3xl:overflow-visible">
        {sections.map((section) => (
          <li key={section.id} className={cn("shrink-0", section.tone === "danger" && "@3xl:mt-3 @3xl:border-t @3xl:pt-3")}>
            <SideNavItem
              section={section}
              active={section.id === active}
              changed={countIn(section, changedIds)}
              invalid={countIn(section, errorIds) > 0}
              onSelect={() => onSelect(section.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SectionPanel({ section, form, fieldId }: { section: SettingsSection; form: ReturnType<typeof useSettingsForm>; fieldId: (id: string) => string }) {
  const danger = section.tone === "danger"
  return (
    <section aria-label={section.title} className="flex flex-col gap-6">
      <h3 className="text-display text-2xl text-balance @2xl:text-3xl">
        {section.title}. {section.description ? <span className="text-muted-foreground">{section.description}</span> : null}
      </h3>
      <div className={cn("flex flex-col divide-y rounded-2xl border bg-background dark:bg-card", danger ? "border-destructive/40" : SOFT_SHADOW_CLASS)}>
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
    </section>
  )
}

function SettingsSidebarView({ title = "Settings.", titleQuiet = "Nothing changes until you save.", sections = SAMPLE_SECTIONS, onSave, className, ...props }: SettingsViewProps) {
  const baseId = useId()
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "")
  const form = useSettingsForm(sections, onSave)
  const fieldId = (id: string) => `${baseId}-field-${id}`
  const section = sections.find((item) => item.id === activeId) ?? sections[0]
  const errorIds = Object.keys(form.errors)
  const barVisible = form.changedIds.length > 0 || form.status === "saved" || form.status === "saving"

  const save = async () => {
    const firstInvalid = await form.save()
    if (!firstInvalid) return
    // The problem may sit in a section that is not showing, where nobody would ever find it.
    // flushSync: the field only exists once that section has rendered, and focus has to land on it now.
    const home = sections.find((item) => item.rows.some((row) => row.id === firstInvalid))
    flushSync(() => setActiveId(home?.id ?? activeId))
    document.getElementById(fieldId(firstInvalid))?.focus()
  }

  return (
    <div data-slot="settings-page" data-variant="sidebar" className={cn("@container w-full bg-muted dark:bg-background", SETTINGS_TOUCH_CLASS, className)} {...props}>
      <div className="grid min-h-[640px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] @3xl:grid-cols-[240px_minmax(0,1fr)] @3xl:grid-rows-1">
        <aside className="min-w-0 border-b @3xl:border-r @3xl:border-b-0">
          <div className="flex min-w-0 flex-col gap-4 p-4 @3xl:sticky @3xl:top-0 @3xl:py-8">
            <div className="flex flex-col gap-1 px-3">
              <h2 className="text-title text-xl">{title}</h2>
              {titleQuiet ? <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">{titleQuiet}</p> : null}
            </div>
            <SideNav sections={sections} active={section?.id ?? ""} changedIds={form.changedIds} errorIds={errorIds} onSelect={setActiveId} />
          </div>
        </aside>
        {/* Its own container: the rows inside must answer to this column, not to the width of the whole block. */}
        <div className="@container min-w-0">
          <div className="flex flex-col gap-8 p-4 @3xl:p-8 @5xl:p-12">
            {section ? <SectionPanel key={section.id} section={section} form={form} fieldId={fieldId} /> : null}
            <Materialize show={barVisible} origin="50% 100%" className="sticky bottom-4 z-10">
              <SaveBar status={form.status} changedCount={form.changedIds.length} errorCount={errorIds.length} onDiscard={form.discard} onSave={save} />
            </Materialize>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsSidebarView }
