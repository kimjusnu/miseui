export type Category = "core" | "ai"

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
  /** minimal usage snippet, TSX */
  usage: string
  /** named exports of the component file */
  exports: string[]
}

export const CATEGORY_LABELS: Record<Category, string> = {
  core: "Core",
  ai: "AI states",
}
