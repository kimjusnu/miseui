import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "pricing-table",
  title: "Pricing Table",
  category: "blocks",
  description: "Three plans with one dominant centre, an honest yearly anchor and feature rows you can read straight across.",
  why: {
    principle: "Default effect and anchoring",
    explanation:
      "Comparing three plans is tiring, so most people take the one that looks like the normal choice. The centre plan is raised, labelled and holds the only accent, which makes it that default without hiding the others. The crossed-out monthly price beside the yearly one gives the number something real to be judged against, and identical rows on every plan let the eye read straight across.",
    avoid:
      "Forbidden: a fake discount from a price nobody ever paid, a hidden or hard-to-find way to cancel, and a fake countdown. They are dark patterns and they are what this block must never be used for. Recommend the plan that really fits most customers, and show the yearly total so the billing is not a surprise.",
  },
  usage: `import { PricingTable } from "@/components/pricing-table"

<PricingTable
  plans={plans}
  defaultBilling="yearly"
  onSelect={(planId, billing) => openCheckout(planId, billing)}
/>`,
  exports: ["PricingTable"],
}
