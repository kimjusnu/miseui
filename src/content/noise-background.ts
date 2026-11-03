import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "noise-background",
  title: "Noise Background",
  category: "backgrounds",
  description: "Film grain drawn from an inline SVG with no image files: fine grain, warm paper, grain over a soft accent wash, or sparse flecks.",
  why: {
    principle: "Aesthetic-usability effect",
    explanation:
      "A flat digital fill can feel unfinished. A trace of grain gives it the texture of a real material, which people read as care, and it breaks up the colour steps in a soft gradient. It stays too faint to take attention from the text.",
    avoid:
      "Do not make grain strong enough to see at reading distance, or it looks like a dirty screen. There is no animated version on purpose: grain that moves pulls the eye from everything else on the page.",
  },
  designs: [
    { name: "grain", principle: "Material honesty", use: "On a plain panel that feels too flat, where you should barely be able to say what changed." },
    { name: "paper", principle: "Familiarity", use: "On reading pages and notes, where a coarse warm surface suggests something printed." },
    { name: "tint", principle: "Common region", use: "On a highlighted section, where a soft accent wash sets it apart and the grain keeps the gradient smooth." },
    { name: "speckle", principle: "Isolation effect", use: "On a landing section or a card with a personal tone, where sparse flecks read like stationery." },
  ],
  usage: `import { NoiseBackground } from "@/components/ui/noise-background"

<NoiseBackground className="rounded-xl border p-8">
  <p>Every note is kept for as long as your workspace exists.</p>
</NoiseBackground>

<NoiseBackground variant="tint" className="rounded-xl p-8">…</NoiseBackground>`,
  exports: ["NoiseBackground", "noiseTile"],
}
