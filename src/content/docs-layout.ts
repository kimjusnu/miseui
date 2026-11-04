import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "docs-layout",
  title: "Docs Layout",
  category: "blocks",
  description: "A documentation screen from a list of pages: nav, page and table of contents, one column for a short guide, or text beside its code. Collapses on phones.",
  why: {
    principle: "Information scent",
    explanation:
      "People arrive at documentation from a search, in the middle of a task, and decide within seconds whether they are in the right place. The current page stays marked, the table of contents follows what is being read, and each jump moves focus along with the scroll, so a keyboard continues from the section it landed on.",
    avoid:
      "Do not use it for marketing pages or for a blog, where the reader is not looking something up. Use centered rather than sidebar when there are only a few pages: an empty nav makes a small product look unfinished.",
  },
  designs: [
    {
      name: "sidebar",
      principle: "Information scent",
      use: "A product with enough pages that people move around. Nav, page and table of contents each answer where am I, what am I reading and what is left here.",
    },
    {
      name: "centered",
      principle: "Reading measure",
      use: "A short guide read once from top to bottom, with numbered steps and nothing in the margins.",
    },
    {
      name: "reference",
      principle: "Proximity",
      use: "An API reference, where people came to copy something and want the explanation beside it. On phones the code drops under its own text.",
    },
  ],
  usage: `import { DocsLayout } from "@/components/docs-layout"

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
<DocsLayout variant="reference" groups={groups} className="h-dvh" />`,
  exports: ["DocsLayout"],
}
