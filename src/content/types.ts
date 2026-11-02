export type Category = "blocks" | "ai" | "effects" | "transitions" | "core"

export interface EffectMeta {
  /** value of the `effect` prop */
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
  /** the `effect` prop values a core component offers; each carries its own reason, like the component does */
  effects?: readonly EffectMeta[]
  /** minimal usage snippet, TSX */
  usage: string
  /** named exports of the component file */
  exports: string[]
}

/** Whole screens first: they are what someone who does not design came for. Then the parts, AI first. */
export const CATEGORY_ORDER: readonly Category[] = ["blocks", "ai", "effects", "transitions", "core"]

export const CATEGORY_LABELS: Record<Category, string> = {
  blocks: "Blocks",
  ai: "AI states",
  effects: "Effects",
  transitions: "Transitions",
  core: "Core",
}
