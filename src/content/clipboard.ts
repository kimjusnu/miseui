import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "clipboard",
  title: "Clipboard",
  category: "forms",
  description: "One-press copy with a clear result: a lone icon, a code line, a read-only field or a labelled block, and a safe way out when the browser refuses.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "Copying changes nothing on screen, so without feedback people copy again to be sure. A check in the same spot closes the loop where they are already looking. When the browser refuses, the text is selected and the message says so, which leaves a next step in place of a silent failure.",
    avoid:
      "Do not use it for secrets that should not be shown; the value is on the page. Do not make it the only way to read the text, and do not copy on hover or on load, since browsers refuse without a click.",
  },
  designs: [
    {
      name: "icon",
      principle: "Fitts's law",
      use: "Next to text that is already on screen, such as a table cell or a link, where one more word would crowd the row.",
    },
    {
      name: "inline",
      principle: "Law of proximity",
      use: "For a one-line install command in documentation, where the line and its button read as one object.",
    },
    {
      name: "field",
      principle: "Affordance",
      use: "For a share link or an API endpoint that people may also want to select and read in a form.",
    },
    {
      name: "block",
      principle: "Visual hierarchy",
      use: "For several lines with a file name, where the heading says what it is before anyone reads the contents.",
    },
  ],
  effects: [
    {
      name: "morph",
      principle: "Continuity",
      use: "When the button is small and the change could be missed: the copy glyph blurs into the check, which draws the eye without moving anything.",
    },
  ],
  usage: `import { Clipboard } from "@/components/ui/clipboard"

<Clipboard value="https://example.com/invite/8f2" variant="field" effect="morph" />

<Clipboard variant="inline" value="pnpm dlx shadcn add clipboard" />
<Clipboard variant="block" title="deploy.sh" value={script} onFailed={report} />`,
  exports: ["Clipboard", "copyText"],
}
