import { PricingTable, type PricingTableVariant } from "@/registry/miseui/blocks/pricing-table"

export function Demo({ variant }: { variant?: string }) {
  return <PricingTable variant={variant as PricingTableVariant} />
}
