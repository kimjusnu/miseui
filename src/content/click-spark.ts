import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "click-spark",
  title: "Click Spark",
  category: "interactions",
  description: "A wrapper that answers a press with a small burst from that point: lines, falling bits, one soft ring or a little confetti, on one canvas that only draws while something is alive.",
  why: {
    principle: "Peak-end rule",
    explanation:
      "People remember the best moment of an experience and how it ended, so a small burst on the press that matters makes the moment feel finished. It starts under the pointer at once, which confirms the press without asking anyone to look elsewhere, and it is gone before the next thing happens.",
    avoid:
      "Use it for a press that deserves a moment, such as a like, a finished task or a claimed reward, not for every button. It adds nothing a person needs, so the result of the press must still be shown some other way. A burst on a destructive action would celebrate the wrong thing.",
  },
  designs: [
    {
      name: "spark",
      principle: "Doherty threshold",
      use: "The everyday choice: a few short lines, quick enough to sit on any small action.",
    },
    {
      name: "dots",
      principle: "Physicality",
      use: "A friendly product: round bits thrown out and pulled down by light gravity, as if they had weight.",
    },
    {
      name: "ring",
      principle: "Figure and ground",
      use: "A serious interface: one soft band spreading from the press, the most restrained answer here.",
    },
    {
      name: "confetti",
      principle: "Peak-end rule",
      use: "The end of something worth celebrating, such as a finished course or a first sale. Rare by nature: daily confetti stops meaning anything.",
    },
  ],
  usage: `import { ClickSpark } from "@/components/ui/click-spark"

<ClickSpark variant="spark" className="w-fit">
  <Button onClick={like}>Like</Button>
</ClickSpark>

<ClickSpark variant="confetti" count={14} className="w-fit">
  <Button onClick={finish}>Finish the course</Button>
</ClickSpark>`,
  exports: ["ClickSpark"],
}
