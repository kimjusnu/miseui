# Site Footer

The end of every page, in three decisions: a full map of the site, one quiet line, or a newsletter field above the links. The product name and links are sample content.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/site-footer.json
```

## Why it looks like this

**Information scent.** People who reach the bottom of a page and did not find what they came for look for a list of everything. Named groups give them a trail to follow, and a footer is where they expect to find it, so the page above can stay about one thing. Every link is a 40 px target on touch, because this is the one place where a page is all small text links.

**Don't.** Do not repeat your whole navigation or add a link for every page you have, since a long footer is as hard to scan as none. Do not use signup unless you will really write to people on the schedule the note promises.

## Designs

Pass one as the `variant` prop.

- `columns` (Information scent): A marketing site with several sections, where people arrive deep in a page and look for the way around.
- `minimal` (Signal to noise): An app, a docs site or a single page: the navigation is already on screen, so the footer only owes the legal links.
- `signup` (Reciprocity): You publish regularly and readers who finished a page are the ones worth asking, after the page has given them something.

## Usage

```tsx
import { SiteFooter } from "@/components/site-footer"

<SiteFooter
  brand="Your product"
  tagline="One sentence on what it does."
  columns={[{ title: "Product", links: [{ label: "Pricing", href: "/pricing" }] }]}
  legal={[{ label: "Privacy", href: "/privacy" }]}
/>

// An app or a short site: one line
<SiteFooter variant="minimal" links={[{ label: "Terms", href: "/terms" }]} />

// A rejected promise keeps the address and offers another try
<SiteFooter variant="signup" onSubscribe={(email) => api.subscribe(email)} />
```

Exports: `SiteFooter`
