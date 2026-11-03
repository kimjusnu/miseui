import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "code-block",
  title: "Code Block",
  category: "display",
  description: "Readable code without a highlighting library: a small tokenizer for ts, json and bash, line numbers, marked lines, wrap, copy, file tabs and diffs.",
  why: {
    principle: "Pre-attentive processing",
    explanation:
      "Before reading a line, the eye has already picked out what stands apart. One accent for keywords and a quieter tone for comments and punctuation give code its shape with no rainbow competing for attention, so a marked line or a changed line remains the loudest thing in the block.",
    avoid:
      "Do not use it for a single command in a sentence; use the inline clipboard. Do not rely on the tokenizer for languages it does not know: pass your own tokens.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "In docs, between paragraphs, where the code is the content and the controls should wait until the block is in use.",
    },
    {
      name: "window",
      principle: "Law of common region",
      use: "When the file name matters, so that the name and its contents read as one thing.",
    },
    {
      name: "tabs",
      principle: "Progressive disclosure",
      use: "When one idea spans several files, or when the same step is shown for different package managers.",
    },
    {
      name: "diff",
      principle: "Change blindness",
      use: "When showing what changed. Marks and tinted lines do what the eye cannot do by comparing two blocks, and copying gives the new version.",
    },
  ],
  effects: [
    {
      name: "line-reveal",
      principle: "Serial position effect",
      use: "On a landing page, to walk through a short example. Leave it off in docs, where people came to read straight away.",
    },
  ],
  usage: `import { CodeBlock } from "@/components/ui/code-block"

<CodeBlock code={source} language="ts" lineNumbers highlightLines={[3, 4]} />

<CodeBlock variant="window" title="server.ts" code={source} language="ts" />

<CodeBlock variant="tabs" files={[
  { name: "pnpm", code: "pnpm add motion", language: "bash" },
  { name: "npm", code: "npm install motion", language: "bash" },
]} />

<CodeBlock variant="diff" language="ts" code={unifiedDiff} lineNumbers />`,
  exports: ["CodeBlock", "tokenize"],
}
