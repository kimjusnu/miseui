import type * as React from "react"
import { ScrollShadow, type ScrollShadowVariant } from "@/registry/miseui/ui/scroll-shadow"

const NOTES = [
  ["2.14", "Search now finds archived threads"],
  ["2.13", "Exports keep table formatting"],
  ["2.12", "Faster start on older laptops"],
  ["2.11", "Dark theme for shared pages"],
  ["2.10", "Reminders follow your time zone"],
  ["2.9", "Comments can be resolved in bulk"],
  ["2.8", "Paste images into any note"],
  ["2.7", "Keyboard shortcuts for moving rows"],
  ["2.6", "Two-step sign-in for all plans"],
] as const

const CHANNELS = ["General", "Design", "Engineering", "Support", "Billing", "Launch", "Hiring", "Random", "Legal"]

const VARIANTS: ReadonlyArray<{ variant: ScrollShadowVariant; label: string }> = [
  { variant: "shadow", label: "shadow" },
  { variant: "fade", label: "fade" },
  { variant: "line", label: "line" },
  { variant: "none-at-rest", label: "none-at-rest, marks only while scrolling" },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Notes() {
  return (
    <ul className="grid">
      {NOTES.map(([version, text]) => (
        <li key={version} className="grid grid-cols-[48px_minmax(0,1fr)] gap-2 border-b px-3 py-2 text-[13px] leading-5 last:border-b-0">
          <span className="text-muted-foreground tabular-nums">{version}</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map(({ variant, label }) => (
        <Cell key={variant} label={label}>
          <div className="min-w-0 overflow-hidden rounded-md border bg-background">
            <ScrollShadow variant={variant} className="h-48" aria-label={`Release notes, ${variant}`}>
              <Notes />
            </ScrollShadow>
          </div>
        </Cell>
      ))}
      <Cell label="sideways, on your own element">
        <ScrollShadow axis="x" variant="fade" asChild aria-label="Channels">
          <ul className="flex gap-2 py-1">
            {CHANNELS.map((channel) => (
              <li key={channel} className="shrink-0 rounded-full border bg-background px-3 py-1 text-[13px]">
                {channel}
              </li>
            ))}
          </ul>
        </ScrollShadow>
      </Cell>
      <Cell label="both axes">
        <div className="min-w-0 border bg-background">
          <ScrollShadow axis="both" className="h-40" aria-label="Quarterly table">
            <table className="w-[480px] text-left text-[13px]">
              <tbody>
                {CHANNELS.map((channel, row) => (
                  <tr key={channel} className="border-b last:border-b-0">
                    <th className="px-3 py-2 font-medium">{channel}</th>
                    {[1, 2, 3, 4].map((quarter) => (
                      <td key={quarter} className="px-3 py-2 tabular-nums text-muted-foreground">
                        {(row + 2) * quarter * 13}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollShadow>
        </div>
      </Cell>
    </div>
  )
}
