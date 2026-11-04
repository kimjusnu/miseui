# Pricing Table

Pricing with an honest yearly anchor, in three forms: three plans with one raised, a side-by-side feature matrix with a sticky plan header, or one plan priced by the seat.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/pricing-table.json
```

## Why it looks like this

**Default effect and anchoring.** Comparing three plans is tiring, so most people take the one that looks like the normal choice. The centre plan is raised, labelled and holds the only accent, which makes it that default without hiding the others. The crossed-out monthly price beside the yearly one gives the number something real to be judged against, and identical rows on every plan let the eye read straight across.

**Don't.** Forbidden: a fake discount from a price nobody ever paid, a hidden or hard-to-find way to cancel, and a fake countdown. They are dark patterns and they are what this block must never be used for. Recommend the plan that really fits most customers, and show the yearly total so the billing is not a surprise.

## Designs

Pass one as the `variant` prop.

- `cards` (Default effect): Most buyers should land on one plan and only glance at the others: the raised middle plan makes that choice for them.
- `comparison` (Law of common region): Buyers decide line by line, such as a finance team checking for SAML: every row sits under one sticky plan header.
- `single` (Hick's law): You have one plan priced by the seat: nothing to choose between, so the page shows what it costs for this team.

## Usage

```tsx
import { PricingTable } from "@/components/pricing-table"

<PricingTable
  variant="cards"
  plans={plans}
  defaultBilling="yearly"
  onSelect={(planId, billing) => openCheckout(planId, billing)}
/>

// Give rows a group to get headings, and stickyTop for a fixed site header
<PricingTable variant="comparison" plans={plans} stickyTop={64} />

// The plan's prices are per seat here
<PricingTable
  variant="single"
  plans={[plan]}
  defaultSeats={5}
  onSelect={(planId, billing, seats) => openCheckout(planId, billing, seats)}
/>
```

Exports: `PricingTable`
