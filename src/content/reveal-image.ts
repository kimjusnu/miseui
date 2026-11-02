import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "reveal-image",
  title: "Reveal Image",
  category: "effects",
  description:
    "An image that arrives as it is generated: blur to sharp, coarse mosaic to fine, or a left-to-right wipe, driven by a progress value.",
  why: {
    principle: "Perceived progress",
    explanation:
      "A blank frame for eight seconds is a wait; an image that sharpens as the model works is progress. People can judge the composition long before the last detail lands, and cancel early if it is wrong, so the reveal saves real time as well as patience. Every mode is driven by the same 0..1 value, and at 1 the image is shown untouched.",
    avoid:
      "Do not wrap images that are already on disk in a loading reveal; a fake arrival for a cached file is theatre and slows people down. Use it only while progress is real.",
  },
  usage: `import { RevealImage } from "@/components/ui/reveal-image"

// \`progress\` is 0..1 from your generation stream
<RevealImage src={url} alt="Generated poster" progress={progress} />
<RevealImage src={url} alt="Generated poster" progress={progress} mode="pixelate" />
<RevealImage src={url} alt="Generated poster" progress={progress} mode="wipe" className="w-64 rounded-lg" />`,
  exports: ["RevealImage"],
}
