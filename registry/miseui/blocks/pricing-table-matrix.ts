import type { PricingFeature, PricingPlan } from "./pricing-table-parts"

interface MatrixGroup {
  /** Empty for rows that were given no group. */
  name: string
  rows: readonly string[]
}

function withRow(groups: readonly MatrixGroup[], feature: PricingFeature): readonly MatrixGroup[] {
  const name = feature.group ?? ""
  const existing = groups.find((group) => group.name === name)
  if (!existing) return [...groups, { name, rows: [feature.label] }]
  if (existing.rows.includes(feature.label)) return groups
  return groups.map((group) => (group === existing ? { ...group, rows: [...group.rows, feature.label] } : group))
}

/** Every row any plan mentions, in first-seen order, so a plan with an extra feature still gets its line. */
function matrixGroups(plans: readonly PricingPlan[]) {
  return plans.flatMap((plan) => plan.features).reduce<readonly MatrixGroup[]>(withRow, [])
}

/** A plan that never mentions a row does not have it. */
function matrixValue(plan: PricingPlan, label: string) {
  return plan.features.find((feature) => feature.label === label)?.value ?? false
}

export { matrixGroups, matrixValue, type MatrixGroup }
