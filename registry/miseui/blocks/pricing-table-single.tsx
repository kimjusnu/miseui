import { useId } from "react"
import { Check, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Label } from "@/registry/miseui/ui/label"
import { NumberInput } from "@/registry/miseui/ui/number-input"
import { BillingToggle, NoPlans, PricingError, bestYearlySaving, useBilling, type PricingCommonProps } from "./pricing-table-billing"
import { formatMoney, type PricingBilling, type PricingPlan } from "./pricing-table-parts"
import { SINGLE_PLANS } from "./pricing-table-sample"
import { seatSummary, seatTotals, useSeats, type PricingSeatProps } from "./pricing-table-seats"

const DEFAULT_MIN_SEATS = 1
const DEFAULT_MAX_SEATS = 500
const PRICE_START = { opacity: 0, y: 8 }
const PRICE_END = { opacity: 1, y: 0 }
const PLATE_SHADOW_CLASS = "shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--foreground)_24%,transparent)] dark:shadow-none"

interface TotalProps {
  plan: PricingPlan
  billing: PricingBilling
  seats: number
  currency: string
}

/** Keyed on billing only: a total that re-enters on every seat would judder while someone holds the plus button. */
function SeatTotal({ plan, billing, seats, currency }: TotalProps) {
  const reduceMotion = useReducedMotion()
  const { perSeat, perMonth, anchor, billedYearly, yearlySaving } = seatTotals(plan, billing, seats)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2">
        {anchor ? (
          <s data-testid="anchor-price" className="text-[15px] text-muted-foreground tabular-nums">
            <span className="sr-only">Monthly price </span>
            {formatMoney(anchor, currency)}
          </s>
        ) : null}
        <motion.span
          key={billing}
          data-testid="seat-total"
          className="text-display text-4xl tabular-nums @md:text-5xl"
          initial={reduceMotion ? false : PRICE_START}
          animate={PRICE_END}
          transition={SPRING_DEFAULT}
        >
          {formatMoney(perMonth, currency)}
        </motion.span>
        <span className="text-[13px] text-muted-foreground">/ month</span>
      </div>
      <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
        {seatSummary(billing, seats, formatMoney(perSeat, currency), formatMoney(billedYearly, currency))}
      </p>
      {yearlySaving > 0 ? <p className="text-[13px] leading-relaxed text-muted-foreground">You save {formatMoney(yearlySaving, currency)} a year.</p> : null}
    </div>
  )
}

function IncludedList({ plan }: { plan: PricingPlan }) {
  const included = plan.features.filter((feature) => feature.value !== false)
  return (
    <ul aria-label={`${plan.name} includes`} className="grid grid-cols-1 gap-x-6 gap-y-3 text-[15px] leading-relaxed @lg:grid-cols-2">
      {included.map((feature) => (
        <li key={feature.label} className="flex min-w-0 items-start gap-3">
          <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 text-pretty">
            {feature.label}
            {typeof feature.value === "string" ? <span className="text-muted-foreground"> {feature.value}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}

interface PlateProps extends PricingSeatProps {
  plan: PricingPlan
  billing: PricingBilling
  onBillingChange: (billing: PricingBilling) => void
  currency: string
  pending: boolean
  current: boolean
  disabled: boolean
  onSelect?: PricingCommonProps["onSelect"]
}

function SeatPlate({ plan, billing, onBillingChange, currency, pending, current, disabled, onSelect, minSeats = DEFAULT_MIN_SEATS, maxSeats = DEFAULT_MAX_SEATS, ...seatProps }: PlateProps) {
  const seatFieldId = useId()
  const [count, setCount] = useSeats(seatProps)
  return (
    <div className={cn("flex min-w-0 flex-col gap-6 rounded-2xl border bg-background p-6 @md:p-8 dark:bg-card", PLATE_SHADOW_CLASS)}>
      <BillingToggle billing={billing} saving={bestYearlySaving([plan])} exact roomyTouch onChange={onBillingChange} />
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={seatFieldId}>Seats</Label>
        <NumberInput
          id={seatFieldId}
          variant="split"
          value={count}
          min={minSeats}
          max={maxSeats}
          onValueChange={setCount}
          incrementLabel="Add a seat"
          decrementLabel="Remove a seat"
          className="w-36"
        />
      </div>
      <SeatTotal plan={plan} billing={billing} seats={count} currency={currency} />
      <Button
        size="lg"
        variant="mise"
        disabled={disabled || current}
        aria-busy={pending || undefined}
        onClick={() => onSelect?.(plan.id, billing, count)}
        className="w-full"
      >
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
        {current ? "Current plan" : plan.cta}
      </Button>
    </div>
  )
}

function PricingSingle({
  plans = SINGLE_PLANS,
  billing,
  defaultBilling = "yearly",
  onBillingChange,
  onSelect,
  title = "One plan, priced by the seat.",
  description = "Add people when they start, remove them when they leave.",
  currency = "USD",
  pendingPlanId,
  currentPlanId,
  error,
  seat,
  className,
  ...props
}: PricingCommonProps & { seat?: PricingSeatProps }) {
  const [active, change] = useBilling(billing, defaultBilling, onBillingChange)
  const plan = plans.find((candidate) => candidate.recommended) ?? plans[0]
  return (
    <section data-slot="pricing-table" data-variant="single" className={cn("@container w-full bg-muted/40 dark:bg-background", className)} {...props}>
      <div className="px-6 py-12 @2xl:py-16">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)] items-center gap-8 @3xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] @3xl:gap-12">
          <div className="flex min-w-0 flex-col gap-8">
            <h2 className="text-display text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
              {title} <span className="text-muted-foreground">{description}</span>
            </h2>
            {plan ? <IncludedList plan={plan} /> : <NoPlans />}
          </div>
          {plan ? (
            <SeatPlate
              plan={plan}
              billing={active}
              onBillingChange={change}
              currency={currency}
              pending={plan.id === pendingPlanId}
              current={plan.id === currentPlanId}
              disabled={pendingPlanId !== undefined}
              onSelect={onSelect}
              {...seat}
            />
          ) : null}
          <div className="@3xl:col-span-2 empty:hidden">
            <PricingError message={error} />
          </div>
        </div>
      </div>
    </section>
  )
}

export { PricingSingle }
