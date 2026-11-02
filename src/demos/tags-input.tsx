import { TagsInput } from "@/registry/miseui/ui/tags-input"

const SKILLS = ["Research", "Interviews", "Prototyping", "Typography", "Illustration", "Motion", "Accessibility"] as const
const looksLikeEmail = (tag: string) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tag) ? null : "Enter a full email address.")

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">plain, suggestions, limit of 5, pop effect</p>
        <TagsInput aria-label="Skills" placeholder="Add a skill" defaultValue={["Research", "Prototyping"]} suggestions={SKILLS} max={5} effect="pop" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">inline</p>
        <TagsInput aria-label="Keywords" variant="inline" placeholder="Add a keyword" defaultValue={["onboarding", "retention"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">stacked, validated, paste a list of addresses</p>
        <TagsInput aria-label="Invite by email" variant="stacked" placeholder="name@example.com" defaultValue={["mina@example.com"]} validate={looksLikeEmail} effect="pop" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">compact, one line that scrolls</p>
        <TagsInput aria-label="Filter by label" variant="compact" placeholder="Filter" defaultValue={["bug", "design", "billing", "urgent"]} />
      </div>
    </div>
  )
}
