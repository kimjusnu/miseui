import { render, screen, waitFor } from "@testing-library/react"
import { StorySection } from "./story-section"

const state = vi.hoisted(() => ({ reduced: false, inView: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = false
})

const slot = (name: string) => document.querySelector(`[data-slot='story-section-${name}']`) as HTMLElement

describe("StorySection", () => {
  it("is a region named by its heading, at the level you ask for", () => {
    render(
      <StorySection id="problem" no={2} title="The problem" as="h3">
        <p>Half of teams never invited anyone.</p>
      </StorySection>,
    )
    const region = screen.getByRole("region", { name: "The problem" })
    expect(region).toHaveAttribute("id", "problem")
    expect(screen.getByRole("heading", { level: 3, name: "The problem" })).toBeInTheDocument()
    expect(slot("number")).toHaveTextContent("02")
  })

  it("keeps a number given as text and leaves the number out when there is none", () => {
    const { rerender } = render(<StorySection no="A" title="Notes">Body</StorySection>)
    expect(slot("number")).toHaveTextContent("A")
    rerender(<StorySection title="Notes">Body</StorySection>)
    expect(slot("number")).toBeNull()
  })

  it("lays out differently for each variant", () => {
    const { rerender } = render(<StorySection no={1} title="Result" variant="stacked">Body</StorySection>)
    const root = () => screen.getByRole("region")
    expect(root().className).toContain("border-t")
    expect(slot("layout").className).not.toContain("grid-cols")
    expect(slot("number").className).toContain("font-mono")

    rerender(<StorySection no={1} title="Result" variant="aside">Body</StorySection>)
    // The query has to sit below the container, or it would ask the root about itself and never match.
    expect(root().className).toContain("@container")
    expect(slot("layout").className).toContain("@xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]")
    expect(slot("header").className).toContain("@xl:sticky")

    rerender(<StorySection no={1} title="Result" variant="chapter">Body</StorySection>)
    expect(root().className).not.toContain("border-t")
    expect(slot("number").className).toContain("cqi")
  })

  it("shows the pending note only with no content, and nothing when it has neither", () => {
    const { rerender, container } = render(<StorySection title="Later" pending="What changed after launch?" />)
    expect(slot("pending")).toHaveTextContent("What changed after launch?")
    rerender(<StorySection title="Later" pending="What changed after launch?">Real text</StorySection>)
    expect(slot("pending")).toBeNull()
    rerender(<StorySection title="Later" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("holds the text back until it is seen with the reveal effect", async () => {
    const { rerender } = render(<StorySection title="Result" effect="reveal">Body</StorySection>)
    expect(slot("body").style.opacity).toBe("0")
    state.inView = true
    rerender(<StorySection title="Result" effect="reveal">Body</StorySection>)
    await waitFor(() => expect(Number(slot("body").style.opacity)).toBeGreaterThan(0))
  })

  it("shows the text at once when motion is off", () => {
    state.reduced = true
    render(<StorySection title="Result" effect="reveal">Body</StorySection>)
    expect(slot("body").style.opacity).toBe("")
    expect(slot("body")).toHaveTextContent("Body")
  })
})
