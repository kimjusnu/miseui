import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "skeleton",
  title: "Skeleton",
  category: "display",
  description: "Pulsing placeholder shaped like the content that is loading, so the wait feels shorter than a spinner.",
  why: {
    principle: "Perceived performance",
    explanation:
      "A spinner says “wait”; a skeleton says “here is what is coming”. Because the layout is already in place, users read the shape while the data loads and judge the same wait as shorter, and nothing jumps when the real content arrives.",
    avoid:
      "Skip it for loads under about 300 ms, where it only flashes, and for content whose shape you cannot predict. A skeleton that does not match the final layout is worse than a spinner.",
  },
  effects: [
    {
      name: "pulse",
      principle: "Perceived performance",
      use: "As the default for short loads, where the shape alone does the work and motion should stay quiet.",
    },
    {
      name: "wave",
      principle: "Perceived progress",
      use: "On loads of a few seconds, where a band travelling one way suggests something is moving toward done.",
    },
    {
      name: "gooey",
      principle: "Law of continuity",
      use: "While a model generates text, where blocks merging into lines say the content is forming, not just fetching.",
    },
  ],
  usage: `import { Skeleton } from "@/components/ui/skeleton"

<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-4 w-24" />
  </div>
</div>
<Skeleton effect="gooey" lines={3} />`,
  exports: ["Skeleton"],
}
