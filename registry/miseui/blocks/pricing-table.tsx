import { PricingCards } from "./pricing-table-cards"
import { PricingComparison } from "./pricing-table-comparison"
import type { PricingCommonProps } from "./pricing-table-billing"
import type { PricingBilling, PricingFeature, PricingPlan } from "./pricing-table-parts"
import type { PricingSeatProps } from "./pricing-table-seats"
import { PricingSingle } from "./pricing-table-single"

type PricingTableVariant = "cards" | "comparison" | "single"

interface PricingTableProps extends PricingCommonProps, PricingSeatProps {
  /** `cards` three plans with one raised, `comparison` every row side by side, `single` one plan priced by the seat. */
  variant?: PricingTableVariant
  /** Sends a beam around the recommended plan instead of its still accent border, on `cards`. */
  beam?: boolean
  /** On `comparison`, how far below the top of the page the plan header sticks: the height of your fixed site header, in px. */
  stickyTop?: number
}

function PricingTable({ variant, beam, stickyTop, seats, defaultSeats, minSeats, maxSeats, onSeatsChange, ...props }: PricingTableProps) {
  switch (variant) {
    case "comparison":
      return <PricingComparison stickyTop={stickyTop} {...props} />
    case "single":
      return <PricingSingle seat={{ seats, defaultSeats, minSeats, maxSeats, onSeatsChange }} {...props} />
    default:
      return <PricingCards beam={beam} {...props} />
  }
}

export { PricingTable, type PricingBilling, type PricingFeature, type PricingPlan, type PricingTableProps, type PricingTableVariant }
