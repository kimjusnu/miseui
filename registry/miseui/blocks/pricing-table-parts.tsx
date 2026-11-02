import { Check, Loader2, Minus } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Button } from "@/registry/miseui/ui/button"
import { Card } from "@/registry/miseui/ui/card"

type PricingBilling = "monthly" | "yearly"

interface PricingFeature {
  label: string
  /** Text such as "Unlimited", or a plain yes or no. */
  value: string | boolean
}

interface PricingPlan {
  id: string
  name: string
  description: string
  /** Price per month on the monthly plan. */
  monthly: number
  /** Price per month when billed yearly. Keep it true: this is what the crossed-out anchor is compared with. */
  yearly: number
  cta: string
  /** The plan that carries the visual weight. Mark one. */
  recommended?: boolean
  /** Same rows in the same order on every plan, so the eye can read straight across. */
  features: readonly PricingFeature[]
}

const MONTHS_IN_YEAR = 12
const PRICE_START = { opacity: 0, y: 8 }
const PRICE_END = { opacity: 1, y: 0 }

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface PlanPriceProps {
  plan: PricingPlan
  billing: PricingBilling
  currency: string
}

function PlanPrice({ plan, billing, currency }: PlanPriceProps) {
  const reduceMotion = useReducedMotion()
  const yearly = billing === "yearly"
  const amount = yearly ? plan.yearly : plan.monthly
  const anchored = yearly && plan.monthly > plan.yearly
  const free = plan.monthly === 0
  const note = free
    ? "No card needed"
    : yearly
      ? `${formatMoney(plan.yearly * MONTHS_IN_YEAR, currency)} billed yearly`
      : "Billed monthly"
  return (
    <div className="flex flex-col gap-1 px-6">
      <div className="flex flex-wrap items-baseline gap-x-2">
        {anchored ? (
          <s data-testid="anchor-price" className="text-[15px] text-muted-foreground tabular-nums">
            <span className="sr-only">Monthly price </span>
            {formatMoney(plan.monthly, currency)}
          </s>
        ) : null}
        <motion.span
          key={billing}
          className={cn("text-display tabular-nums", plan.recommended ? "text-4xl" : "text-3xl")}
          initial={reduceMotion ? false : PRICE_START}
          animate={PRICE_END}
          transition={SPRING_DEFAULT}
        >
          {formatMoney(amount, currency)}
        </motion.span>
        <span className="text-[13px] text-muted-foreground">/ month</span>
      </div>
      <p className="text-[13px] text-muted-foreground">{note}</p>
    </div>
  )
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "string") return <span className="text-right">{value}</span>
  const Icon = value ? Check : Minus
  return (
    <span className="grid size-4 shrink-0 place-items-center">
      <span className="sr-only">{value ? "Included" : "Not included"}</span>
      <Icon aria-hidden="true" className={cn("size-4", !value && "text-muted-foreground")} />
    </span>
  )
}

interface PlanCardProps {
  plan: PricingPlan
  billing: PricingBilling
  currency: string
  /** Let the light travel around the recommended plan. Off by default: a loop on a page people read is decoration. */
  beam: boolean
  pending: boolean
  current: boolean
  disabled: boolean
  onSelect?: (planId: string, billing: PricingBilling) => void
}

/** A subgrid row per region, so prices, buttons and feature rows line up across plans whatever the copy length. */
function PlanCard({ plan, billing, currency, beam, pending, current, disabled, onSelect }: PlanCardProps) {
  const emphasized = Boolean(plan.recommended)
  return (
    <Card
      effect={emphasized && beam ? "beam" : undefined}
      data-recommended={emphasized ? "true" : undefined}
      className={cn(
        "row-span-4 grid grid-rows-subgrid rounded-2xl",
        emphasized
          ? "z-10 order-first bg-popover shadow-[0_24px_48px_-24px_color-mix(in_oklab,var(--mise)_32%,oklch(0_0_0/40%))] @3xl:order-none @3xl:-my-6 @3xl:py-12"
          : "bg-card shadow-none",
        emphasized && !beam && "border-mise/60",
      )}
    >
      <div className="flex flex-col gap-2 px-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-medium">{plan.name}</h3>
          {emphasized ? <Badge variant="mise">Recommended</Badge> : null}
        </div>
        <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">{plan.description}</p>
      </div>
      <PlanPrice plan={plan} billing={billing} currency={currency} />
      <div className="px-6">
        <Button
          variant={emphasized ? "mise" : "outline"}
          disabled={disabled || current}
          aria-busy={pending || undefined}
          onClick={() => onSelect?.(plan.id, billing)}
          className="w-full"
        >
          {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
          {current ? "Current plan" : plan.cta}
        </Button>
      </div>
      <ul aria-label={`${plan.name} features`} className="flex flex-col px-6 text-[13px] leading-relaxed">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-center justify-between gap-3 border-t py-2">
            <span className="min-w-0 text-muted-foreground">{feature.label}</span>
            <FeatureValue value={feature.value} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

export { PlanCard, type PricingBilling, type PricingFeature, type PricingPlan }
