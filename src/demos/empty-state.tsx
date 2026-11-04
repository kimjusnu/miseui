import { EmptyState, type EmptyStateVariant } from "@/registry/miseui/blocks/empty-state"

export function Demo({ variant }: { variant?: string }) {
  return <EmptyState variant={variant as EmptyStateVariant | undefined} />
}
