# Docs Layout

A documentation screen from a list of pages: nav, page and table of contents, one column for a short guide, or text beside its code. Collapses on phones.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/docs-layout.json
```

## Why it looks like this

**Information scent.** People arrive at documentation from a search, in the middle of a task, and decide within seconds whether they are in the right place. The current page stays marked, the table of contents follows what is being read, and each jump moves focus along with the scroll, so a keyboard continues from the section it landed on.

**Don't.** Do not use it for marketing pages or for a blog, where the reader is not looking something up. Use centered rather than sidebar when there are only a few pages: an empty nav makes a small product look unfinished.

## Designs

Pass one as the `variant` prop.

- `sidebar` (Information scent): A product with enough pages that people move around. Nav, page and table of contents each answer where am I, what am I reading and what is left here.
- `centered` (Reading measure): A short guide read once from top to bottom, with numbered steps and nothing in the margins.
- `reference` (Proximity): An API reference, where people came to copy something and want the explanation beside it. On phones the code drops under its own text.

## Usage

```tsx
import { DocsLayout } from "@/components/docs-layout"

const groups = [
  {
    label: "Get started",
    pages: [
      {
        id: "quick-start",
        title: "Quick start",
        lead: "Send your first invoice.",
        sections: [
          {
            id: "install",
            title: "Install the library",
            body: <p>Add the package to your project.</p>,
            code: { title: "Terminal", code: "npm install paperline", language: "bash" },
          },
        ],
      },
    ],
  },
]

// sidebar and reference scroll inside themselves. Give them the height of your page.
<DocsLayout groups={groups} className="h-dvh" />

// Your router owns the page: pass current, and an href on each page.
<DocsLayout groups={groups} current={params.page} className="h-dvh" />

// A short guide. The page itself scrolls.
<DocsLayout variant="centered" groups={groups} />

// Text beside its code.
<DocsLayout variant="reference" groups={groups} className="h-dvh" />
```

Exports: `DocsLayout`
