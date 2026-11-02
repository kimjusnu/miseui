export type Category = "blocks" | "ai" | "forms" | "navigation" | "overlays" | "display" | "feedback" | "text" | "backgrounds" | "effects" | "transitions"

export interface EffectMeta {
  /** value of the `variant` or `effect` prop */
  name: string
  /** named principle, shorter than the component's */
  principle: string
  /** one sentence: the moment this effect is the right one */
  use: string
}

export interface ComponentMeta {
  /** registry item name, kebab-case, equals file name */
  name: string
  title: string
  category: Category
  /** one sentence, shown under the title and in llms.txt */
  description: string
  why: {
    /** named psychological principle, e.g. "Doherty threshold" */
    principle: string
    /** 2-3 sentences: what the design does for the user and why */
    explanation: string
    /** when this component or effect should NOT be used */
    avoid: string
  }
  /** the `variant` prop values: different looks for the same job, each with its own reason */
  designs?: readonly EffectMeta[]
  /** the `effect` prop values: motion and behaviour, each with its own reason */
  effects?: readonly EffectMeta[]
  /** minimal usage snippet, TSX */
  usage: string
  /** named exports of the component file */
  exports: string[]
}

/** Whole screens first: they are what someone who does not design came for. Then the parts, AI first. */
export const CATEGORY_ORDER: readonly Category[] = [
  "blocks",
  "ai",
  "forms",
  "navigation",
  "overlays",
  "display",
  "feedback",
  "text",
  "backgrounds",
  "effects",
  "transitions",
]

export const CATEGORY_LABELS: Record<Category, string> = {
  blocks: "Blocks",
  ai: "AI states",
  forms: "Forms",
  navigation: "Navigation",
  overlays: "Overlays",
  display: "Display",
  feedback: "Feedback",
  text: "Text",
  backgrounds: "Backgrounds",
  effects: "Effects",
  transitions: "Transitions",
}
