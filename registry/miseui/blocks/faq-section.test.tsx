import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FaqSection, type FaqItem, type FaqSectionVariant } from "./faq-section"
import { faqCountLabel, filterFaq } from "./faq-section-filter"

function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="faq-section"]') as HTMLElement

const ITEMS: readonly FaqItem[] = [
  { id: "one", question: "How do I cancel?", answer: "From billing settings.", keywords: "refund" },
  { id: "two", question: "Can I export my data?", answer: "As Markdown or PDF." },
  { id: "three", question: "Is there a trial?", answer: <em>Yes, a free one.</em>, keywords: "demo" },
]

describe("FaqSection", () => {
  it("renders accordion with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<FaqSection />)
    expect(root(plain)).toHaveAttribute("data-variant", "accordion")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<FaqSection variant={unknown as FaqSectionVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "accordion")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = (["accordion", "split", "search"] as const).map((variant) => {
      const { container } = render(<FaqSection variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(3)
    render(<FaqSection variant="split" />)
    expect(document.querySelector('[data-slot="faq-section-aside"]')).toBeInTheDocument()
  })

  it("stays at the top of a tall frame on every variant, so an opening row does not move what is under the pointer", () => {
    for (const variant of ["accordion", "split", "search"] as const) {
      const { container, unmount } = render(<FaqSection variant={variant} />)
      expect(root(container).className).toContain("justify-start")
      expect(root(container).className).not.toContain("justify-center")
      unmount()
    }
  })

  it("renders the heading and nothing broken with no questions", () => {
    for (const variant of ["accordion", "split", "search"] as const) {
      const { unmount } = render(<FaqSection variant={variant} items={[]} contact={null} headline="Help." headlineQuiet="Soon." />)
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Help. Soon.")
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
      unmount()
    }
  })

  describe("accordion", () => {
    it("opens the first answer and leaves the rest closed", () => {
      render(<FaqSection items={ITEMS} />)
      expect(screen.getByRole("button", { name: "How do I cancel?" })).toHaveAttribute("aria-expanded", "true")
      expect(screen.getByText("From billing settings.")).toBeVisible()
      expect(screen.queryByText("As Markdown or PDF.")).not.toBeInTheDocument()
    })

    it("opens and moves between questions by keyboard", async () => {
      render(<FaqSection items={ITEMS} contact={null} />)
      await userEvent.tab()
      expect(screen.getByRole("button", { name: "How do I cancel?" })).toHaveFocus()
      await userEvent.keyboard("{ArrowDown}")
      const second = screen.getByRole("button", { name: "Can I export my data?" })
      expect(second).toHaveFocus()
      await userEvent.keyboard("{Enter}")
      expect(second).toHaveAttribute("aria-expanded", "true")
      expect(screen.getByText("As Markdown or PDF.")).toBeInTheDocument()
      expect(screen.queryByText("From billing settings.")).not.toBeInTheDocument()
    })

    it("sends people to the contact the owner gives, and drops the line on null", () => {
      const { rerender } = render(<FaqSection items={ITEMS} contact={{ prompt: "Stuck?", label: "Email us", href: "mailto:help@example.com" }} />)
      expect(screen.getByRole("link", { name: "Email us" })).toHaveAttribute("href", "mailto:help@example.com")
      expect(screen.getByRole("link", { name: "Email us" }).className).toContain("pointer-coarse:after:-inset-y-2.5")
      rerender(<FaqSection items={ITEMS} contact={null} />)
      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
  })

  describe("split", () => {
    it("keeps the heading and the contact beside the questions, and opens by keyboard", async () => {
      const { container } = render(<FaqSection variant="split" items={ITEMS} />)
      const aside = container.querySelector('[data-slot="faq-section-aside"]') as HTMLElement
      expect(within(aside).getByRole("heading", { level: 2 })).toBeInTheDocument()
      expect(within(aside).getByRole("link", { name: "Write to support" })).toBeInTheDocument()
      const last = screen.getByRole("button", { name: "Is there a trial?" })
      last.focus()
      await userEvent.keyboard(" ")
      expect(screen.getByText("Yes, a free one.")).toBeInTheDocument()
    })
  })

  describe("search", () => {
    const field = () => screen.getByRole("searchbox", { name: "Search questions" })

    it("filters as you type and says how many are left", async () => {
      render(<FaqSection variant="search" items={ITEMS} />)
      expect(screen.getByText("3 questions")).toHaveAttribute("role", "status")
      await userEvent.type(field(), "export")
      expect(screen.getByText("1 of 3 questions")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Can I export my data?" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "How do I cancel?" })).not.toBeInTheDocument()
    })

    it("finds a question through its keywords when the answer is not plain text", async () => {
      render(<FaqSection variant="search" items={ITEMS} />)
      await userEvent.type(field(), "DEMO")
      expect(screen.getByRole("button", { name: "Is there a trial?" })).toBeInTheDocument()
    })

    it("shows an empty state that names the search, and clearing it brings everything back with focus in the box", async () => {
      const { container } = render(<FaqSection variant="search" items={ITEMS} />)
      await userEvent.type(field(), "blockchain")
      const empty = container.querySelector('[data-slot="empty"]') as HTMLElement
      expect(within(empty).getByRole("heading", { name: /No answer for .blockchain./ })).toBeInTheDocument()
      expect(screen.getByText("0 of 3 questions")).toBeInTheDocument()
      expect(within(empty).getByRole("link", { name: "Write to support" })).toBeInTheDocument()
      await userEvent.click(within(empty).getByRole("button", { name: "Clear search" }))
      expect(field()).toHaveValue("")
      expect(screen.getByRole("button", { name: "How do I cancel?" })).toBeInTheDocument()
      await waitFor(() => expect(field()).toHaveFocus())
    })

    it("clears from the box as well, and answers open by keyboard after a filter", async () => {
      render(<FaqSection variant="search" items={ITEMS} />)
      await userEvent.type(field(), "cancel")
      await userEvent.tab()
      expect(screen.getByRole("button", { name: "Clear search" })).toHaveFocus()
      await userEvent.keyboard("{Enter}")
      expect(field()).toHaveValue("")
      expect(field()).toHaveFocus()
      await userEvent.tab()
      expect(screen.getByRole("button", { name: "How do I cancel?" })).toHaveFocus()
      await userEvent.keyboard("{Enter}")
      expect(screen.getByText("From billing settings.")).toBeInTheDocument()
    })

    it("keeps the way to support on screen under the results", async () => {
      render(<FaqSection variant="search" items={ITEMS} />)
      expect(screen.getByRole("link", { name: "Write to support" })).toBeInTheDocument()
      await userEvent.type(field(), "export")
      expect(screen.getByRole("link", { name: "Write to support" })).toBeInTheDocument()
    })
  })

  describe("filterFaq", () => {
    it("returns everything for a blank query", () => {
      expect(filterFaq(ITEMS, "   ")).toBe(ITEMS)
    })

    it("needs every word, in any order, across question, answer and keywords", () => {
      expect(filterFaq(ITEMS, "refund billing").map((item) => item.id)).toEqual(["one"])
      expect(filterFaq(ITEMS, "billing export")).toEqual([])
    })

    it("counts in words that do not contradict an empty list", () => {
      expect(faqCountLabel(3, 3)).toBe("3 questions")
      expect(faqCountLabel(0, 3)).toBe("0 of 3 questions")
      expect(faqCountLabel(1, 1)).toBe("1 question")
    })
  })
})
