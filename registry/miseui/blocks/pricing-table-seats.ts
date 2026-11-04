import { useState } from "react"
import { MONTHS_IN_YEAR, type PricingBilling, type PricingPlan } from "./pricing-table-parts"

const DEFAULT_SEATS = 5

interface PricingSeatProps {
  /** Control the seat count yourself. Leave it out and the block keeps its own, starting from `defaultSeats`. */
  seats?: number
  defaultSeats?: number
  minSeats?: number
  maxSeats?: number
  onSeatsChange?: (seats: number) => void
}

/** Prices per seat on the plan. Everything shown is worked out from these, so no sum on screen can disagree with another. */
function seatTotals(plan: PricingPlan, billing: PricingBilling, seats: number) {
  const perSeat = billing === "yearly" ? plan.yearly : plan.monthly
  const yearlySaving = billing === "yearly" ? (plan.monthly - plan.yearly) * seats * MONTHS_IN_YEAR : 0
  return {
    perSeat,
    perMonth: perSeat * seats,
    anchor: yearlySaving > 0 ? plan.monthly * seats : undefined,
    billedYearly: plan.yearly * seats * MONTHS_IN_YEAR,
    yearlySaving,
  }
}

function seatSummary(billing: PricingBilling, seats: number, perSeat: string, billedYearly: string) {
  const people = `${seats} ${seats === 1 ? "seat" : "seats"} at ${perSeat}`
  return billing === "yearly" ? `${people}, ${billedYearly} billed yearly` : `${people}, billed monthly`
}

function useSeats({ seats, defaultSeats = DEFAULT_SEATS, onSeatsChange }: PricingSeatProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultSeats)
  // A cleared field is someone halfway through typing. The last good count stays until they settle on a new one.
  const change = (next: number | null) => {
    if (next === null) return
    setUncontrolled(next)
    onSeatsChange?.(next)
  }
  return [seats ?? uncontrolled, change] as const
}

export { seatSummary, seatTotals, useSeats, type PricingSeatProps }
