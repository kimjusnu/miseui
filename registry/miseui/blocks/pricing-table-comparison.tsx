import type * as React from "react"
import { Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { ScrollShadow } from "@/registry/miseui/ui/scroll-shadow"
import {
  BillingToggle,
  NoPlans,
  PricingError,
  PricingHeader,
  bestYearlySaving,
  useBilling,
  type PricingCommonProps,
} from "./pricing-table-billing"
import { matrixGroups, matrixValue, type MatrixGroup } from "./pricing-table-matrix"
import { FeatureValue, billingNote, formatMoney, type PricingBilling, type PricingPlan } from "./pricing-table-parts"
import { COMPARISON_PLANS } from "./pricing-table-sample"

const FEATURE_COLUMN_PX = 128
const PLAN_COLUMN_PX = 160
const PRICE_START = { opacity: 0, y: 8 }
const PRICE_END = { opacity: 1, y: 0 }

/** Opaque, because rows slide underneath. Each surface below must be the same one the cell sits on. */
const planSurface = (plan: PricingPlan) => (plan.recommended ? "bg-muted" : "bg-background")
/** A wide table sticks to the page, a narrow one to its own scroller, so only the wide one honours the site header's height. */
const STICKY_HEAD_CLASS = "sticky top-0 @3xl:top-(--pricing-sticky-top) border-b align-top"
/** z-11: above the scroller's edge shadows (z-10), which would otherwise paint across the pinned column. */
const FEATURE_CELL_CLASS = "sticky left-0 z-11 border-r bg-background pr-2 pl-6 text-start @3xl:border-r-0 @3xl:pl-0"

interface HeadProps {
  plan: PricingPlan
  billing: PricingBilling
  currency: string
  pendingPlanId?: string
  currentPlanId?: string
  onSelect?: PricingCommonProps["onSelect"]
}

function PlanHead({ plan, billing, currency, pendingPlanId, currentPlanId, onSelect }: HeadProps) {
  const reduceMotion = useReducedMotion()
  const yearly = billing === "yearly"
  const current = plan.id === currentPlanId
  const pending = plan.id === pendingPlanId
  return (
    // abbr is what a screen reader repeats on every cell of the column: the plan's name, not its price and button too.
    <th scope="col" abbr={plan.name} className={cn(STICKY_HEAD_CLASS, "z-20 p-3 text-start font-normal @3xl:p-4", planSurface(plan))}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-medium">{plan.name}</span>
          {plan.recommended ? <span className="text-[13px] text-muted-foreground">Recommended</span> : null}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {yearly && plan.monthly > plan.yearly ? (
              <s data-testid="anchor-price" className="text-[13px] text-muted-foreground tabular-nums">
                <span className="sr-only">Monthly price </span>
                {formatMoney(plan.monthly, currency)}
              </s>
            ) : null}
            <motion.span
              key={billing}
              className="text-display text-2xl tabular-nums"
              initial={reduceMotion ? false : PRICE_START}
              animate={PRICE_END}
              transition={SPRING_DEFAULT}
            >
              {formatMoney(yearly ? plan.yearly : plan.monthly, currency)}
            </motion.span>
            <span className="text-[13px] text-muted-foreground">/ month</span>
          </div>
          <p className="text-[13px] text-muted-foreground">{billingNote(plan, billing, currency)}</p>
        </div>
        <Button
          variant={plan.recommended ? "mise" : "outline"}
          disabled={pendingPlanId !== undefined || current}
          aria-busy={pending || undefined}
          onClick={() => onSelect?.(plan.id, billing)}
          className="h-auto min-h-9 w-full px-2 py-1.5 whitespace-normal pointer-coarse:min-h-10"
        >
          {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {current ? "Current plan" : plan.cta}
        </Button>
      </div>
    </th>
  )
}

function GroupRows({ group, plans }: { group: MatrixGroup; plans: readonly PricingPlan[] }) {
  return (
    <tbody>
      {group.name ? (
        <tr>
          <th scope="rowgroup" className={cn(FEATURE_CELL_CLASS, "pt-6 pb-2 text-[15px] font-medium")}>
            {group.name}
          </th>
          {plans.map((plan) => (
            <td key={plan.id} className={cn(plan.recommended && "bg-muted")} />
          ))}
        </tr>
      ) : null}
      {group.rows.map((label) => (
        <tr key={label}>
          <th scope="row" className={cn(FEATURE_CELL_CLASS, "border-b py-3 font-normal text-muted-foreground")}>
            {label}
          </th>
          {plans.map((plan) => (
            <td key={plan.id} className={cn("border-b px-3 py-3 @3xl:px-4", plan.recommended && "bg-muted")}>
              <span className="flex">
                <FeatureValue value={matrixValue(plan, label)} />
              </span>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

interface MatrixProps extends Omit<HeadProps, "plan"> {
  plans: readonly PricingPlan[]
}

/** Overflow is on only while narrow: on a wide table it would capture the sticky header, which would stop following the page. */
function Matrix({ plans, ...head }: MatrixProps) {
  return (
    <ScrollShadow
      axis="both"
      aria-label="Plans compared feature by feature"
      className="-mx-6 @3xl:mx-0"
      scrollerClassName="relative max-h-[560px] @3xl:max-h-none @3xl:overflow-visible"
    >
      {/* Only while narrow: once overflow is off, a table wider than the page would widen the page. relative on the scroller keeps the absolute sr-only text in the cells inside its clip. */}
      <table
        className="w-full min-w-(--matrix-min-width) table-fixed border-separate border-spacing-0 text-[13px] leading-relaxed @3xl:min-w-0"
        style={{ "--matrix-min-width": `${FEATURE_COLUMN_PX + plans.length * PLAN_COLUMN_PX}px` } as React.CSSProperties}
      >
        <colgroup>
          <col className="w-32 @3xl:w-1/4" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={cn(STICKY_HEAD_CLASS, FEATURE_CELL_CLASS, "z-30 pt-3 font-normal @3xl:pt-4")}>
              <span className="sr-only">Feature</span>
            </th>
            {plans.map((plan) => (
              <PlanHead key={plan.id} plan={plan} {...head} />
            ))}
          </tr>
        </thead>
        {matrixGroups(plans).map((group) => (
          <GroupRows key={group.name} group={group} plans={plans} />
        ))}
      </table>
    </ScrollShadow>
  )
}

function PricingComparison({
  plans = COMPARISON_PLANS,
  billing,
  defaultBilling = "yearly",
  onBillingChange,
  onSelect,
  title = "Every line, side by side.",
  description = "Move up or down whenever you like.",
  currency = "USD",
  stickyTop = 0,
  pendingPlanId,
  currentPlanId,
  error,
  className,
  style,
  ...props
}: PricingCommonProps & { stickyTop?: number }) {
  const [active, change] = useBilling(billing, defaultBilling, onBillingChange)
  const rootStyle = { "--pricing-sticky-top": `${stickyTop}px`, ...style } as React.CSSProperties
  return (
    <section data-slot="pricing-table" data-variant="comparison" className={cn("@container w-full bg-background", className)} style={rootStyle} {...props}>
      <div className="px-6 py-12 @2xl:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <PricingHeader title={title} description={description}>
            {plans.length > 0 ? <BillingToggle billing={active} saving={bestYearlySaving(plans)} roomyTouch onChange={change} /> : null}
          </PricingHeader>
          {plans.length > 0 ? (
            <Matrix plans={plans} billing={active} currency={currency} pendingPlanId={pendingPlanId} currentPlanId={currentPlanId} onSelect={onSelect} />
          ) : (
            <NoPlans />
          )}
          <PricingError message={error} />
        </div>
      </div>
    </section>
  )
}

export { PricingComparison }
