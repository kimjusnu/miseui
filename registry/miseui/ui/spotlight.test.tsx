import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Spotlight, SpotlightGroup } from "./spotlight"

const spot = (testId: string) => screen.getByTestId(testId)
const light = (testId: string) => spot(testId).querySelector("[data-slot='spotlight-light']") as HTMLElement

function point(element: HTMLElement, type: "pointerMove" | "pointerLeave", pointerType: string, clientX = 0, clientY = 0) {
  fireEvent[type](element, { pointerType, clientX, clientY, bubbles: true })
}

describe("Spotlight", () => {
  it("lights up under a mouse and goes out when it leaves", () => {
    render(<Spotlight data-testid="card">Queue</Spotlight>)
    expect(light("card").className).toContain("opacity-0")
    point(spot("card"), "pointerMove", "mouse", 40, 20)
    expect(spot("card")).toHaveAttribute("data-lit", "true")
    expect(light("card").className).toContain("opacity-100")
    point(spot("card"), "pointerLeave", "mouse")
    expect(spot("card")).not.toHaveAttribute("data-lit")
  })

  it("stays off for a finger", () => {
    render(<Spotlight data-testid="card">Queue</Spotlight>)
    point(spot("card"), "pointerMove", "touch", 40, 20)
    expect(spot("card")).not.toHaveAttribute("data-lit")
  })

  it("writes the pointer position relative to the card", async () => {
    render(<Spotlight data-testid="card">Queue</Spotlight>)
    spot("card").getBoundingClientRect = () => ({ left: 10, top: 5, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) })
    point(spot("card"), "pointerMove", "mouse", 40, 25)
    await waitFor(() => expect(spot("card").style.getPropertyValue("--mise-spot-x")).toBe("30px"))
    expect(spot("card").style.getPropertyValue("--mise-spot-y")).toBe("20px")
  })

  it("draws a different layer for each variant", () => {
    const { rerender } = render(<Spotlight data-testid="card" variant="glow" />)
    expect(light("card").className).toContain("-z-10")
    expect(light("card").className).not.toContain("p-px")

    rerender(<Spotlight data-testid="card" variant="border" />)
    expect(light("card").className).toContain("p-px")
    expect(spot("card").querySelector("[data-slot='spotlight-grid']")).toBeNull()

    rerender(<Spotlight data-testid="card" variant="reveal" />)
    expect(spot("card").querySelector("[data-slot='spotlight-grid']")).not.toBeNull()

    rerender(<Spotlight data-testid="card" variant="reveal" revealed={<span>Under the light</span>} />)
    expect(screen.getByText("Under the light").closest("[aria-hidden='true']")).not.toBeNull()
    expect(spot("card").querySelector("[data-slot='spotlight-grid']")).toBeNull()
  })

  it("keeps its children and passes handlers on", () => {
    const onPointerMove = vi.fn()
    render(
      <Spotlight data-testid="card" onPointerMove={onPointerMove}>
        <a href="#plan">Plan</a>
      </Spotlight>,
    )
    point(spot("card"), "pointerMove", "mouse")
    expect(onPointerMove).toHaveBeenCalledOnce()
    expect(screen.getByRole("link", { name: "Plan" })).toBeInTheDocument()
  })

  it("lights every card in a group from one pointer, and none for a finger", () => {
    render(
      <SpotlightGroup data-testid="group">
        <Spotlight data-testid="a" variant="border" />
        <Spotlight data-testid="b" effect="trail" />
      </SpotlightGroup>,
    )
    point(spot("group"), "pointerMove", "touch", 5, 5)
    expect(spot("a")).not.toHaveAttribute("data-lit")
    point(spot("a"), "pointerMove", "mouse", 5, 5)
    expect(spot("a")).toHaveAttribute("data-lit", "true")
    expect(spot("b")).toHaveAttribute("data-lit", "true")
    expect(spot("b")).toHaveAttribute("data-effect", "trail")
    point(spot("group"), "pointerLeave", "mouse")
    expect(spot("a")).not.toHaveAttribute("data-lit")
    expect(spot("b")).not.toHaveAttribute("data-lit")
  })
})
