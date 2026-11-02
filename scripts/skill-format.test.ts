import { formatLlmsTxt, formatReference, formatSkill } from "./skill-format"
import type { ComponentMeta } from "../src/content/types"

const button: ComponentMeta = {
  name: "button",
  title: "Button",
  category: "core",
  description: "Press target.",
  why: { principle: "Doherty threshold", explanation: "Feedback under 400 ms.", avoid: "No glow everywhere." },
  usage: "<Button>Save</Button>",
  exports: ["Button", "buttonVariants"],
}

const thinking: ComponentMeta = {
  name: "thinking-indicator",
  title: "Thinking Indicator",
  category: "ai",
  description: "Breathing dots.",
  why: { principle: "Visibility of system status", explanation: "Silence reads as failure.", avoid: "Not after done." },
  usage: "<ThinkingIndicator />",
  exports: ["ThinkingIndicator"],
}

const site = "https://miseui.pages.dev"

describe("formatReference", () => {
  it("includes the install command, principle, avoid rule and usage", () => {
    const text = formatReference(button, site)
    expect(text).toContain("# Button")
    expect(text).toContain("npx shadcn@latest add https://miseui.pages.dev/r/button.json")
    expect(text).toContain("Doherty threshold")
    expect(text).toContain("No glow everywhere.")
    expect(text).toContain("<Button>Save</Button>")
    expect(text).toContain("`Button`, `buttonVariants`")
  })
})

describe("formatSkill", () => {
  it("starts with frontmatter and lists every component under its category", () => {
    const text = formatSkill([button, thinking], site)
    expect(text.startsWith("---\nname: miseui\ndescription: ")).toBe(true)
    expect(text).toContain("## Core")
    expect(text).toContain("## AI states")
    expect(text).toContain("- **Button** (`button`): Press target. — Doherty threshold")
    expect(text).toContain("- **Thinking Indicator** (`thinking-indicator`): Breathing dots. — Visibility of system status")
    expect(text).toContain("references/button.md")
  })

  it("lists the AI category before core so agents see the differentiator first", () => {
    const text = formatSkill([button, thinking], site)
    expect(text.indexOf("## AI states")).toBeLessThan(text.indexOf("## Core"))
  })
})

describe("formatLlmsTxt", () => {
  it("starts with the H1 and links every component page", () => {
    const text = formatLlmsTxt([button, thinking], site)
    expect(text.startsWith("# Mise UI")).toBe(true)
    expect(text).toContain("https://miseui.pages.dev/components/button")
    expect(text).toContain("https://miseui.pages.dev/components/thinking-indicator")
    expect(text).toContain("https://miseui.pages.dev/r/button.json")
  })
})
