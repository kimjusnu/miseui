import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "globe",
  title: "Globe",
  category: "interactions",
  description: "A turning dotted earth on one canvas with no 3D library: land dots, a wire ball, a shaded disc or routes with a light along them, plus markers and drag to spin.",
  why: {
    principle: "Picture superiority",
    explanation:
      "A round earth says worldwide faster than any sentence can, and people remember it after the words have gone. One colour, a soft rim and a slow turn keep it an object rather than a screensaver, so the one accent marker still gets the eye. The map data is Natural Earth, which is in the public domain.",
    avoid:
      "Do not use it to report data: half the world is hidden at any moment and a dot near the rim cannot be read. For figures per place use Table or Chart, and keep the markers to a handful.",
  },
  designs: [
    {
      name: "dots",
      principle: "Aesthetic-usability effect",
      use: "The quiet default beside a headline about reach, where the land only has to read as earth.",
    },
    {
      name: "wire",
      principle: "Signifiers",
      use: "A technical product such as infrastructure or logistics, where lines of latitude say measured rather than decorative.",
    },
    {
      name: "solid",
      principle: "Figure-ground",
      use: "A small object on a busy page, or a dark section, where land in the accent has to hold up as one shape.",
    },
    {
      name: "arcs",
      principle: "Common fate",
      use: "When movement between places is the point, such as shipping, payments or a network: the light says which way it goes.",
    },
  ],
  effects: [
    {
      name: "drag",
      principle: "Direct manipulation",
      use: "When people will want to find their own country: it spins with inertia, the page still scrolls vertically, and Left and Right turn it.",
    },
  ],
  usage: `import { Globe } from "@/components/ui/globe"

const markers = [
  { lat: 37.6, lng: 127, label: "Seoul" },
  { lat: 38.7, lng: -9.1, label: "Lisbon" },
]

<Globe label="Our two offices" markers={markers} paused={paused} className="max-w-96" />

<Globe
  variant="arcs"
  effect="drag"
  center={{ lat: 30, lng: 60 }}
  markers={markers}
  arcs={[{ from: markers[0], to: markers[1], label: "Seoul to Lisbon" }]}
/>`,
  exports: ["Globe"],
}
