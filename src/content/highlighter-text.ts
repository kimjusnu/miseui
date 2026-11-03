import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "highlighter-text",
  title: "Highlighter Text",
  category: "text",
  description: "A mark drawn over text that is already readable, line by line, as a marker band, an underline or a hand-drawn stroke or outline.",
  why: {
    principle: "Signalling",
    explanation:
      "Readers who skim land on what is marked, so one marked phrase decides what a paragraph says to most people. The words never move and stay a real mark element; only the mark behind them is drawn, in reading order, so the text is readable before, during and after.",
    avoid:
      "Mark a phrase, not a paragraph, and no more than a few per screen: when everything is marked, nothing is. Do not use it for status or errors, or for links, which already have an underline of their own.",
  },
  designs: [
    {
      name: "marker",
      principle: "Physical metaphor",
      use: "A key phrase in an article or a pricing note, where a soft band reads as somebody's highlighter.",
    },
    {
      name: "underline",
      principle: "Economy of motion",
      use: "Product copy and interfaces, where a thin line is enough and a band would look like a warning.",
    },
    {
      name: "sketch",
      principle: "Humanising detail",
      use: "A landing page or a personal voice: a slightly crooked stroke, the same on every load, looks like a person meant it.",
    },
    {
      name: "box",
      principle: "Law of closure",
      use: "One short word or number to stop on, circled by hand. A wrapped phrase gets one outline per line.",
    },
  ],
  effects: [
    {
      name: "sequence",
      principle: "Staging",
      use: "A paragraph with two or three points, using HighlighterGroup: the marks draw one after another, so the argument is read in order.",
    },
  ],
  usage: `import { HighlighterGroup, HighlighterText } from "@/components/ui/highlighter-text"

<p>
  Refunds land in <HighlighterText>five working days</HighlighterText>.
</p>

<p>
  It costs <HighlighterText variant="box">nothing</HighlighterText> to start.
</p>

<HighlighterGroup>
  Keep the <HighlighterText variant="sketch">first screen</HighlighterText> short and ask for{" "}
  <HighlighterText variant="underline">one decision</HighlighterText>.
</HighlighterGroup>`,
  exports: ["HighlighterText", "HighlighterGroup"],
}
