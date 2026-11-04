import type * as React from "react"
import { useId, useState } from "react"
import { Label } from "@/registry/miseui/ui/label"
import { Switch } from "@/registry/miseui/ui/switch"
import type { PricingBilling, PricingPlan } from "./pricing-table-parts"

const PERCENT = 100

/** Props every design takes, so switching `variant` never means rewiring the page. */
interface PricingCommonProps extends Omit<React.ComponentProps<"section">, "title" | "onSelect"> {
  plans?: readonly PricingPlan[]
  /** Control the toggle yourself. Leave it out and the block keeps its own state, starting from `defaultBilling`. */
  billing?: PricingBilling
  defaultBilling?: PricingBilling
  onBillingChange?: (billing: PricingBilling) => void
  /** `seats` is only passed on the `single` design, where the seat count is chosen here. */
  onSelect?: (planId: string, billing: PricingBilling, seats?: number) => void
  title?: string
  /** The muted second sentence of the heading. */
  description?: string
  /** ISO 4217 code. */
  currency?: string
  /** The plan whose checkout is opening. Every button waits meanwhile. */
  pendingPlanId?: string
  /** The plan this customer is already on. */
  currentPlanId?: string
  /** Checkout failed. Shown under the plans. */
  error?: string
}

/** The biggest saving real prices allow. Computed, never typed in, so the claim cannot drift from the numbers. */
function bestYearlySaving(plans: readonly PricingPlan[]) {
  const savings = plans
    .filter((plan) => plan.monthly > 0)
    .map((plan) => Math.round(((plan.monthly - plan.yearly) / plan.monthly) * PERCENT))
  return Math.max(0, ...savings)
}

function useBilling(billing: PricingBilling | undefined, defaultBilling: PricingBilling, onBillingChange?: (billing: PricingBilling) => void) {
  const [uncontrolled, setUncontrolled] = useState(defaultBilling)
  const change = (next: PricingBilling) => {
    setUncontrolled(next)
    onBillingChange?.(next)
  }
  return [billing ?? uncontrolled, change] as const
}

interface BillingToggleProps {
  billing: PricingBilling
  saving: number
  /** One plan has one saving, so "up to" would be untrue. */
  exact?: boolean
  /** Grows the switch's hit area to 40 px on touch with an invisible layer, without changing how it looks. */
  roomyTouch?: boolean
  onChange: (billing: PricingBilling) => void
}

/** Only the colour marks the active side. A weight change would widen the label and shove the switch sideways. */
function BillingToggle({ billing, saving, exact = false, roomyTouch = false, onChange }: BillingToggleProps) {
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
        className={roomyTouch ? "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-3" : undefined}
      />
      <Label htmlFor={id} className={billing === "yearly" ? "text-foreground" : "text-muted-foreground"}>
        Yearly
      </Label>
      {saving > 0 ? <span className="text-[13px] text-muted-foreground">{exact ? `Save ${saving}%` : `Save up to ${saving}%`}</span> : null}
    </div>
  )
}

function PricingHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-6 @2xl:flex-row @2xl:items-end @2xl:justify-between">
      <h2 className="text-display max-w-lg text-3xl leading-[1.12]! text-balance @2xl:text-4xl">
        {title} <span className="text-muted-foreground">{description}</span>
      </h2>
      {children}
    </header>
  )
}

function NoPlans() {
  return <p className="text-[15px] text-muted-foreground">Plans are not available right now. Check back soon.</p>
}

function PricingError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-[13px] text-pretty text-destructive">
      {message}
    </p>
  )
}

export { BillingToggle, NoPlans, PricingError, PricingHeader, bestYearlySaving, useBilling, type PricingCommonProps }
