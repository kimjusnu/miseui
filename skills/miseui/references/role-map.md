# Role Map

Who did what on a project: panels, quiet rows or a table of people against areas, with one person in the accent.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/role-map.json
```

## Why it looks like this

**Credibility through specifics.** Naming what each person took on says more than a list of skills, and showing what others did makes the claim believable. One person in the accent answers the question most readers came with, while the rest stays in view as context.

**Don't.** It is not an org chart: for reporting lines use a tree. Skip it for one person alone, where a plain list is enough, and past about six people, where the map stops being readable at a glance.

## Designs

Pass one as the `variant` prop.

- `panels` (Law of common region): A case study with two to four people, where each person's share is a small block of its own.
- `rows` (Economy of emphasis): A credits section at the foot of a page, where the names should be findable but not compete with the work.
- `matrix` (Pattern recognition): A handoff or a project plan, where shared areas and gaps should jump out from the grid.

## Effects

Pass one as the `effect` prop.

- `focus` (Selective attention): When several people overlap: pointing at or pressing one person dims the others, so one share can be traced.

## Usage

```tsx
import { RoleMap } from "@/components/ui/role-map"

<RoleMap
  variant="matrix"
  effect="focus"
  label="Launch team"
  members={[
    { name: "Lead engineer", owns: ["API design", "Billing"], lead: true },
    { name: "Designer", role: "Product design", owns: ["Interface", "Billing"] },
  ]}
/>
```

Exports: `RoleMap`, `collectAreas`
