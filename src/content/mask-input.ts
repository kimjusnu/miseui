import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "mask-input",
  title: "Mask Input",
  category: "forms",
  description: "Formats dates, phone numbers, cards and your own patterns as you type. The caret stays put in the middle and on paste, and deleting across a dash works.",
  why: {
    principle: "Error prevention",
    explanation:
      "A field that shapes the value as it is typed removes a whole class of mistakes before anyone can submit them, and grouping digits into chunks makes long numbers easier to check by eye. People do not have to guess the format; the field shows it.",
    avoid:
      "Do not mask what varies between people, such as names or international phone numbers, where a mask rejects real answers. A mask checks shape, not truth: 99/99/2026 fits a date mask, so still validate the value.",
  },
  designs: [
    {
      name: "plain",
      principle: "Consistency",
      use: "Inside a regular form, where it should look like every other text field beside it.",
    },
    {
      name: "grouped",
      principle: "Chunking",
      use: "For long numbers read in pieces, such as a card or an account number, with one box per group.",
    },
    {
      name: "compact",
      principle: "Fit to content",
      use: "In a table cell or a filter row, where the field is exactly as wide as what it holds.",
    },
    {
      name: "otp-like",
      principle: "Recognition over recall",
      use: "For short codes typed from another screen, where one box per character makes a missing character obvious.",
    },
  ],
  usage: `import { MaskInput } from "@/components/ui/mask-input"

<MaskInput
  mask="card"
  variant="grouped"
  aria-label="Card number"
  name="card"
  onValueChange={(raw, masked) => setCard({ raw, masked })}
  onComplete={(raw) => check(raw)}
/>

// Your own pattern and tokens: # digit, A letter in capitals, a letter, * either, \\\\ escapes
<MaskInput mask="AA-####" aria-label="Plate" />
<MaskInput mask="hh:hh" tokens={{ h: { test: (c) => /^[0-9a-f]$/i.test(c) } }} aria-label="Bytes" />`,
  exports: ["MaskInput"],
}
