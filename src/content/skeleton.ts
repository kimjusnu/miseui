import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "skeleton",
  title: "Skeleton",
  category: "core",
  description: "Pulsing placeholder shaped like the content that is loading, so the wait feels shorter than a spinner.",
  why: {
    principle: "Perceived performance",
    explanation:
      "A spinner says “wait”; a skeleton says “here is what is coming”. Because the layout is already in place, users read the shape while the data loads and judge the same wait as shorter, and nothing jumps when the real content arrives.",
    avoid:
      "Skip it for loads under about 300 ms, where it only flashes, and for content whose shape you cannot predict. A skeleton that does not match the final layout is worse than a spinner.",
  },
  usage: `import { Skeleton } from "@/components/ui/skeleton"

<div className="flex items-center gap-3">
  <Skeleton className="size-10 rounded-full" />
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-4 w-24" />
  </div>
</div>`,
  exports: ["Skeleton"],
}
