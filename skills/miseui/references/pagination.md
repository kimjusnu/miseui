# Pagination

Moves through a long list in steady chunks, with the window of pages always the same width so controls never shift.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/pagination.json
```

## Why it looks like this

**Spatial memory.** People clicking through results keep the pointer still and expect the next control to stay under it. The page window always draws the same number of slots, so Next does not move, and the first and last pages stay visible so the size of the list is never a mystery.

**Don't.** Do not paginate a short list that fits on a screen. Do not use dots for more than a handful of slides unless the position hardly matters, and use numbers when people need to come back to a specific page.

## Designs

Pass one as the `variant` prop.

- `numbers` (Recognition over recall): For search results and tables, where people jump to a page they remember and want to see how far the list goes.
- `simple` (Hick's law): In narrow spaces or on phones, when moving one page at a time is all that is needed.
- `dots` (Glanceability): Under a carousel or onboarding steps, where a rough sense of position is enough.
- `load-more` (Goal gradient effect): For feeds and galleries, where a running count shows how far along people are and the scroll position is kept.

## Effects

Pass one as the `effect` prop.

- `spring` (Object constancy): When page changes happen in place: the same indicator travels to the new page, so the eye follows without searching.

## Usage

```tsx
import { Pagination } from "@/components/ui/pagination"

<Pagination pageCount={12} page={page} onPageChange={setPage} effect="spring" />
<Pagination variant="simple" pageCount={12} />
<Pagination variant="dots" pageCount={5} effect="spring" />
<Pagination variant="load-more" itemCount={60} pageSize={24} loading={isFetching} onPageChange={fetchPage} />
```

Exports: `Pagination`, `getPageWindow`, `getDotWindow`
