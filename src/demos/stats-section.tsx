import { StatsSection, type StatsSectionVariant } from "@/registry/miseui/blocks/stats-section"

export function Demo({ variant }: { variant?: string }) {
  return <StatsSection variant={variant as StatsSectionVariant | undefined} locale="en-US" />
}
