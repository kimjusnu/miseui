# View Counter

A view count from a fetcher you pass, with loading and failure handled and no network code of its own.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/view-counter.json
```

## Why it looks like this

**Social proof.** A number of other readers tells someone this is worth their time before they have read a word. It only works if it is trusted, so a loading state never shows a false zero and a failure says so plainly and offers a retry.

**Don't.** Do not show it while the count is embarrassingly low, where it argues against the page. In development React runs effects twice, so make the counting endpoint safe to call twice, for example by keying on the session.

## Designs

Pass one as the `variant` prop.

- `inline` (Visual hierarchy): In the metadata line of an article or a list row, next to the date and reading time, where it should not draw the eye.
- `badge` (Recognition over recall): On a card or a thumbnail where words will not fit: an eye and a number, with the word kept for screen readers.
- `stat` (Focal point): When the number is the news, such as an author dashboard or a campaign page, at a size that holds the block.

## Effects

Pass one as the `effect` prop.

- `count` (Peak-end rule): On a page opened once, where rising from zero gives the number a moment. Avoid it in a long list of rows.
- `odometer` (Skeuomorphism): For a large figure that deserves ceremony: each digit rolls into place while separators and suffixes stay still.

## Usage

```tsx
import { ViewCounter } from "@/components/ui/view-counter"

<ViewCounter
  resourceKey={slug}
  fetcher={async (signal) => {
    const response = await fetch(`/api/views/${slug}`, { method: "POST", signal })
    if (!response.ok) throw new Error(`Views failed: ${response.status}`)
    return (await response.json()).count
  }}
/>

<ViewCounter fetcher={readViews} variant="stat" effect="odometer" label="readers this month" />
```

Exports: `ViewCounter`
