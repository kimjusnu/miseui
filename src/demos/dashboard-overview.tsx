import { DashboardOverview, type DashboardVariant } from "@/registry/miseui/blocks/dashboard-overview"

export function Demo({ variant }: { variant?: string }) {
  return <DashboardOverview variant={variant as DashboardVariant | undefined} />
}
