# Error Page

A 404, 500 or offline screen with honest wording and a way out that can work: one sentence, beside places that still work, or a plain readout for developer tools.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/error-page.json
```

## Why it looks like this

**Error recovery.** An error page is reached by someone who was on their way somewhere else, so its job is to say what happened and get them moving again. The wording blames nobody and claims no cause it cannot know. Each error gets the way out that can work: a 404 cannot be retried, and an offline device cannot follow a link home.

**Don't.** Do not use it for an error inside a working screen: a failed save belongs beside the thing that failed, and a whole page would throw away the rest. Do not add a joke. Nobody who just lost their place wants one.

## Designs

Pass one as the `variant` prop.

- `centered` (Single focus): The usual case: one sentence, one obvious way out, and nothing else competing for attention.
- `split` (Reduce the cost of recovery): A product with many ways in, where a list of pages that still work saves someone starting again from the top.
- `terminal` (Visibility of system status): A developer tool, where people want the facts to paste into a ticket. It is a plain readout of real values, with nothing to type.

## Usage

```tsx
import { ErrorPage } from "@/components/error-page"

// The code decides the wording and the way out.
<ErrorPage code={404} homeHref="/" />

// Pass a reference someone can quote. A rejected retry says it did not work.
<ErrorPage code={500} reference={requestId} onRetry={() => refetch()} />

// It watches the device, and says when a connection is back.
<ErrorPage code="offline" />

// Your own pages beside the apology.
<ErrorPage variant="split" code={404} links={[{ label: "Invoices", description: "Everything you have sent.", href: "/invoices" }]} />

// The facts, ready to paste. time is optional, so pass it from your server.
<ErrorPage variant="terminal" code={500} reference={requestId} time={failedAt} />
```

Exports: `ErrorPage`
