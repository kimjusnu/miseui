import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "metro-map",
  title: "Metro Map",
  category: "navigation",
  description: "Lines and stations from data, for a path that branches and meets again: tap a station, walk with the arrow keys.",
  why: {
    principle: "Spatial memory",
    explanation:
      "People remember where something is more easily than what it is called, and a transit map is a shape nearly everyone already knows how to read. Parallel tracks show what runs at the same time, and a shared station shows where they meet, which a flat list of steps cannot say.",
    avoid:
      "Do not use it for a straight sequence, where Steps or Timeline say the same with less. Stops are evenly spaced on purpose, so do not read distance from it, and do not use it where exact dates matter.",
  },
  designs: [
    {
      name: "transit",
      principle: "Familiarity",
      use: "As the main picture of a page: rings and 45 degree bends, reading left to right and scrolling inside itself on a phone.",
    },
    {
      name: "tube",
      principle: "Signal to noise",
      use: "When there are many stops: small ticks stay quiet and only the current stop and the interchanges get a ring.",
    },
    {
      name: "branch",
      principle: "Reading order",
      use: "In a narrow column or on a phone: a plain vertical list with the lines in its margin, like a commit graph, and no sideways scroll.",
    },
  ],
  effects: [
    {
      name: "ride",
      principle: "Goal gradient",
      use: "When the map is also a progress report: the line is inked up to the current station, so distance covered is visible at a glance.",
    },
  ],
  usage: `import { MetroMap } from "@/components/ui/metro-map"

const lines = [
  {
    id: "research",
    label: "Research",
    tone: "muted",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "brief", label: "Brief", note: "Week 2", at: 1, lane: 1 },
    ],
  },
  {
    id: "build",
    label: "Build",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "launch", label: "Launch", at: 2, lane: 0 },
    ],
  },
]

<MetroMap label="Project plan" lines={lines} defaultSelected="brief" effect="ride" />`,
  exports: ["MetroMap"],
}
