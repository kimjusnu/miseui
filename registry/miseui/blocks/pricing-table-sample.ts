import type { PricingFeature, PricingPlan } from "./pricing-table-parts"

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

interface MatrixValues {
  invoices: string
  recurring: boolean
  exports: boolean
  seats: string
  approvals: boolean
  saml: boolean
  priority: boolean
}

function matrixRows(values: MatrixValues): readonly PricingFeature[] {
  return [
    { group: "Billing", label: "Invoices a month", value: values.invoices },
    { group: "Billing", label: "Payment reminders", value: true },
    { group: "Billing", label: "Recurring invoices", value: values.recurring },
    { group: "Billing", label: "Accounting export", value: values.exports },
    { group: "Team", label: "Team seats", value: values.seats },
    { group: "Team", label: "Approval steps", value: values.approvals },
    { group: "Team", label: "SAML sign-in", value: values.saml },
    { group: "Support", label: "Email support", value: true },
    { group: "Support", label: "Reply within a day", value: values.priority },
  ]
}

const MATRIX_BY_PLAN: Readonly<Record<string, readonly PricingFeature[]>> = {
  solo: matrixRows({ invoices: "20", recurring: false, exports: false, seats: "1", approvals: false, saml: false, priority: false }),
  team: matrixRows({ invoices: "Unlimited", recurring: true, exports: true, seats: "5", approvals: false, saml: false, priority: true }),
  business: matrixRows({ invoices: "Unlimited", recurring: true, exports: true, seats: "25", approvals: true, saml: true, priority: true }),
}

/** The same plans at the same prices, with enough rows that a side-by-side is worth reading. */
const COMPARISON_PLANS: readonly PricingPlan[] = DEFAULT_PLANS.map((plan) => ({ ...plan, features: MATRIX_BY_PLAN[plan.id] }))

/** A false row is left off the list on `single`: with one plan there is nothing to compare it against. */
const SINGLE_PLANS: readonly PricingPlan[] = [
  {
    id: "paperline",
    name: "Paperline",
    description: "Everything is included, for every person on the team.",
    monthly: 12,
    yearly: 10,
    cta: "Start 14-day trial",
    features: [
      { label: "Unlimited invoices", value: true },
      { label: "Payment reminders", value: true },
      { label: "Recurring invoices", value: true },
      { label: "Accounting export", value: true },
      { label: "Approval steps", value: true },
      { label: "SAML sign-in", value: true },
    ],
  },
]

export { COMPARISON_PLANS, DEFAULT_PLANS, SINGLE_PLANS }
