import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "decrypt-text",
  title: "Decrypt Text",
  category: "text",
  description: "Text that starts unreadable and is decoded in place, on first view or behind a real button.",
  why: {
    principle: "Curiosity gap",
    explanation:
      "Showing that something is there but not yet readable makes people want the missing part, and the before-state tells them what kind of thing it is: a password, a redacted fact, an encoded message. The letters keep their final width, so decoding never moves the page, and assistive tech only ever gets the real sentence.",
    avoid:
      "This is theatre and not security: the text is in the page from the start, so never put a real secret here without fetching it on press. Keep it to one line per view, and do not use it for content people came to read.",
  },
  designs: [
    {
      name: "dots",
      principle: "Mental model",
      use: "Anything that behaves like a password or a card number: people already know that dots stand for hidden letters.",
    },
    {
      name: "redact",
      principle: "Figure and ground",
      use: "A fact withheld and then given, one word at a time: the bars show how long each word is, which is the tease.",
    },
    {
      name: "cipher",
      principle: "Signal and noise",
      use: "A technical or playful line in a monospace face: the cipher stays muted and stands still, and each letter locks with a brief mark, so progress is easy to follow.",
    },
    {
      name: "scan",
      principle: "Common fate",
      use: "A line that is being checked or read, such as a verified result: one thin line moves and everything behind it is done, wrapped lines together.",
    },
  ],
  effects: [
    {
      name: "press",
      principle: "User control",
      use: "When the reader should choose the moment, like a shared wifi password in a settings page: it stays encrypted behind a real button, and keyboard and screen reader users get the same choice.",
    },
  ],
  usage: `import { DecryptText } from "@/components/ui/decrypt-text"

<DecryptText text="Card ending 4242 is verified" />

<DecryptText as="h2" text="The launch moves to March" variant="redact" />

<DecryptText text="Backup restored from last night" variant="cipher" />

<DecryptText text="quiet-harbour-41" variant="dots" effect="press" label="Show password" />`,
  exports: ["DecryptText"],
}
