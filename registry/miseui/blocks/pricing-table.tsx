import type * as React from "react"
import { useId, useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Label } from "@/registry/miseui/ui/label"
import { Switch } from "@/registry/miseui/ui/switch"
import {
  PlanCard,
  type PricingBilling,
  type PricingFeature,
  type PricingPlan,
} from "@/registry/miseui/blocks/pricing-table-parts"

const PERCENT = 100

function rows(invoices: string, seats: string, exports: boolean, saml: boolean): readonly PricingFeature[] {
  return [
    { label: "Invoices a month", value: invoices },
    { label: "Team seats", value: seats },
    { label: "Payment reminders", value: true },
    { label: "Accounting export", value: exports },
    { label: "SAML sign-in", value: saml },
  ]
}

const DEFAULT_PLANS: readonly PricingPlan[] = [
  {
    id: "solo",
    name: "Solo",
    description: "For freelancers sending a few invoices.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: rows("20", "1", false, false),
  },
  {
    id: "team",
    name: "Team",
    description: "For small teams that bill every week.",
    monthly: 29,
    yearly: 24,
    cta: "Start 14-day trial",
    recommended: true,
    features: rows("Unlimited", "5", true, false),
  },
  {
    id: "business",
    name: "Business",
    description: "For finance teams with approval steps.",
    monthly: 79,
    yearly: 66,
    cta: "Choose Business",
    features: rows("Unlimited", "25", true, true),
  },
]

/** The biggest saving real prices allow. Computed, never typed in, so the claim cannot drift from the numbers. */
function bestYearlySaving(plans: readonly PricingPlan[]) {
  const savings = plans
    .filter((plan) => plan.monthly > 0)
    .map((plan) => Math.round(((plan.monthly - plan.yearly) / plan.monthly) * PERCENT))
  return Math.max(0, ...savings)
}

interface BillingToggleProps {
  billing: PricingBilling
  saving: number
  onChange: (billing: PricingBilling) => void
}

/** Only the colour marks the active side. A weight change would widen the label and shove the switch sideways. */
function BillingToggle({ billing, saving, onChange }: BillingToggleProps) {
  const id = useId()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label htmlFor={id} className={billing === "monthly" ? "text-foreground" : "text-muted-foreground"}>
        Monthly
      </Label>
      <Switch
        id={id}
        aria-label="Bill yearly"
        checked={billing === "yearly"}
        onCheckedChange={(yearly) => onChange(yearly ? "yearly" : "monthly")}
      />
      <Label htmlFor={id} className={billing === "yearly" ? "text-foreground" : "text-muted-foreground"}>
        Yearly
      </Label>
      {saving > 0 ? <span className="text-[13px] text-muted-foreground">Save up to {saving}%</span> : null}
    </div>
  )
}

interface PricingTableProps extends Omit<React.ComponentProps<"section">, "title" | "onSelect"> {
  plans?: readonly PricingPlan[]
  /** Control the toggle yourself. Leave it out and the block keeps its own state, starting from `defaultBilling`. */
  billing?: PricingBilling
  defaultBilling?: PricingBilling
  onBillingChange?: (billing: PricingBilling) => void
  onSelect?: (planId: string, billing: PricingBilling) => void
  title?: string
  /** The muted second sentence of the heading. */
  description?: string
  /** ISO 4217 code. */
  currency?: string
  /** Sends a beam around the recommended plan instead of its still accent border. */
  beam?: boolean
  /** The plan whose checkout is opening. Every button waits meanwhile. */
  pendingPlanId?: string
  /** The plan this customer is already on. */
  currentPlanId?: string
  /** Checkout failed. Shown under the plans. */
  error?: string
}

function PricingTable({
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
}: PricingTableProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultBilling)
  const active = billing ?? uncontrolled
  const change = (next: PricingBilling) => {
    setUncontrolled(next)
    onBillingChange?.(next)
  }

  return (
    <section data-slot="pricing-table" className={cn("@container w-full bg-muted/40 px-6 py-12 @2xl:py-16", className)} {...props}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-6 @2xl:flex-row @2xl:items-end @2xl:justify-between">
          <h2 className="text-display max-w-lg text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
            {title} <span className="text-muted-foreground">{description}</span>
          </h2>
          {plans.length > 0 ? <BillingToggle billing={active} saving={bestYearlySaving(plans)} onChange={change} /> : null}
        </header>
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
          <p className="text-[15px] text-muted-foreground">Plans are not available right now. Check back soon.</p>
        )}
        {error ? (
          <p role="alert" className="text-[13px] text-pretty text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export { PricingTable, type PricingBilling, type PricingFeature, type PricingPlan, type PricingTableProps }
