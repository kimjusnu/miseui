import { cn } from "@/registry/miseui/lib/utils"
import {
  BillingToggle,
  NoPlans,
  PricingError,
  PricingHeader,
  bestYearlySaving,
  useBilling,
  type PricingCommonProps,
} from "./pricing-table-billing"
import { PlanCard } from "./pricing-table-parts"
import { DEFAULT_PLANS } from "./pricing-table-sample"

interface PricingCardsProps extends PricingCommonProps {
  /** Sends a beam around the recommended plan instead of its still accent border. */
  beam?: boolean
}

function PricingCards({
  plans = DEFAULT_PLANS,
  billing,
  defaultBilling = "yearly",
  onBillingChange,
  onSelect,
  title = "Pay for the team you have today.",
  description = "Move up or down whenever you like.",
  currency = "USD",
  beam = false,
  pendingPlanId,
  currentPlanId,
  error,
  className,
  ...props
}: PricingCardsProps) {
  const [active, change] = useBilling(billing, defaultBilling, onBillingChange)

  return (
    <section data-slot="pricing-table" data-variant="cards" className={cn("@container w-full bg-muted/40 dark:bg-background px-6 py-12", className)} {...props}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <PricingHeader title={title} description={description}>
          {plans.length > 0 ? <BillingToggle billing={active} saving={bestYearlySaving(plans)} onChange={change} /> : null}
        </PricingHeader>
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-3 @3xl:gap-y-0 @3xl:py-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={active}
                currency={currency}
                beam={beam}
                pending={plan.id === pendingPlanId}
                current={plan.id === currentPlanId}
                disabled={pendingPlanId !== undefined}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <NoPlans />
        )}
        <PricingError message={error} />
      </div>
    </section>
  )
}

export { PricingCards }
