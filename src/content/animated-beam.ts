import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "animated-beam",
  title: "Animated Beam",
  category: "interactions",
  description: "A line of light running between two real elements, measured so it follows every reflow: straight, bowed, stepped like a circuit or many sources into one hub.",
  why: {
    principle: "Gestalt connectedness",
    explanation:
      "A line between two things is the strongest grouping there is, stronger than sitting close or sharing a colour, and light moving along it adds direction: this goes into that. Because both ends are real elements and are measured, the line cannot drift away from them when the layout changes.",
    avoid:
      "Do not use it to document a real process: Flow draws steps and arrows from data and needs no motion to be read, and Beam Border is for a light around one box. A loop implies something is flowing, so if nothing is, use `pulse` or a plain line.",
  },
  designs: [
    {
      name: "line",
      principle: "Law of Prägnanz",
      use: "Two things side by side, where the shortest line is the clearest statement.",
    },
    {
      name: "curve",
      principle: "Gestalt continuity",
      use: "Items that do not line up, or a beam that would cross a label: the bow takes it around, and `curvature` sets how far.",
    },
    {
      name: "step",
      principle: "Signifiers",
      use: "Anything about systems, wiring or pipelines, where right angles with rounded corners read as a circuit.",
    },
    {
      name: "hub",
      principle: "Common fate",
      use: "Many sources feeding one product, drawn from data with `AnimatedBeamHub`. It stacks in a narrow container and lies down when there is room.",
    },
  ],
  effects: [
    {
      name: "pulse",
      principle: "Feedback",
      use: "When something really happened, such as a sync or a payment: one light per change of `trigger`, then quiet. Under reduced motion the line fades instead.",
    },
  ],
  usage: `import { useRef } from "react"
import { AnimatedBeam, AnimatedBeamHub } from "@/components/ui/animated-beam"

function Sync() {
  const box = useRef(null)
  const app = useRef(null)
  const db = useRef(null)
  return (
    <div ref={box} className="relative isolate flex justify-between p-4">
      <AnimatedBeam containerRef={box} fromRef={app} toRef={db} paused={paused} />
      <div ref={app} className="size-10 rounded-xl border bg-background" />
      <div ref={db} className="size-10 rounded-xl border bg-background" />
    </div>
  )
}

<AnimatedBeamHub label="Sources feeding the inbox" sources={sources} center={inbox} />`,
  exports: ["AnimatedBeam", "AnimatedBeamHub"],
}
