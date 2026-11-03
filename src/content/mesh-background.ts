import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "mesh-background",
  title: "Mesh Background",
  category: "backgrounds",
  description: "Large soft colour from the accent and its neighbours, barely tinted to vivid, from one corner or split on a diagonal, with an optional slow drift.",
  why: {
    principle: "Aesthetic-usability effect",
    explanation:
      "Soft colour makes a page feel considered before anyone reads it, and it needs no image to do so. Every colour comes from your accent and the hues beside it, so the page still belongs to your palette, and nothing has an edge for the eye to catch on.",
    avoid:
      "Do not use it on every section; once per page gives it weight. On every variant except soft, set body text in foreground, because muted foreground drops below 4.5:1 where the colour is strongest. Do not rely on it for any meaning.",
  },
  designs: [
    { name: "soft", principle: "Restraint", use: "On a product page or a sign-in screen, where the tint is barely there and body text keeps its usual colours." },
    { name: "vivid", principle: "Focal point", use: "In one hero with a solid button on top, as the single loud thing on the page." },
    { name: "corner", principle: "Directional cue", use: "In a section with text on the left: colour enters from the top right and the rest stays clean." },
    { name: "split", principle: "Common fate", use: "On a banner or a closing call to action, where two colours meeting on a diagonal give a calm sense of direction." },
  ],
  effects: [
    {
      name: "drift",
      principle: "Ambient motion",
      use: "In a hero people stay on, where colours moving over about a minute make the page feel alive without being watched. Wire `paused` to a control.",
    },
  ],
  usage: `import { MeshBackground } from "@/components/ui/mesh-background"

<MeshBackground variant="vivid" className="rounded-xl py-24">
  <h1>Start with the first page</h1>
  <Button>Create a workspace</Button>
</MeshBackground>

<MeshBackground variant="soft" effect="drift" paused={paused}>…</MeshBackground>`,
  exports: ["MeshBackground", "MESH_BLOBS"],
}
