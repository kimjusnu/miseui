# FAQ Section

Answers before someone has to ask: a short list on one plate, a longer list beside a heading that stays in view, or a filter box with an empty state. The questions are sample content for a sample product.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/faq-section.json
```

## Why it looks like this

**Progressive disclosure.** A person with one doubt should not have to read six answers to reach it. Questions alone are short enough to scan, so the page stays calm and each answer opens only for whoever needs it. A way to reach a human stays on screen, because someone reading a FAQ is already close to giving up.

**Don't.** Do not hide something everyone needs, such as the price, inside a closed row. Do not write questions nobody asks just to repeat the sales page: people notice, and stop trusting the rest.

## Designs

Pass one as the `variant` prop.

- `accordion` (Progressive disclosure): About seven questions at the end of a landing page, read in one short column.
- `split` (Proximity): A longer list on a wide page: the heading and the way to support stay in view while the questions scroll past.
- `search` (Recognition over recall): A list too long to scan, on a help page, where people arrive with a word in mind. It says when nothing matched, and how to get out of it.

## Usage

```tsx
import { FaqSection } from "@/components/faq-section"

<FaqSection
  headline="Questions, answered."
  headlineQuiet="The ones people ask before they sign up."
  items={[{ id: "cancel", question: "How do I cancel?", answer: "From billing settings." }]}
  contact={{ prompt: "Did not find it?", label: "Write to support", href: "mailto:help@example.com" }}
/>

// A long list on a wide page
<FaqSection variant="split" items={items} />

// keywords catch words the answer does not use, and are needed when the answer is not plain text
<FaqSection
  variant="search"
  items={[{ id: "cancel", question: "How do I cancel?", answer: <Steps />, keywords: "refund stop" }]}
/>
```

Exports: `FaqSection`
