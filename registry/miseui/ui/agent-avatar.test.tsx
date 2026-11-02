import { render, screen } from "@testing-library/react"
import { AgentAvatar } from "./agent-avatar"

describe("AgentAvatar", () => {
  it("draws the same face for the same seed every time", () => {
    const first = render(<AgentAvatar seed="nova" />)
    const markup = first.container.innerHTML
    first.unmount()
    const second = render(<AgentAvatar seed="nova" />)
    expect(second.container.innerHTML).toBe(markup)
    expect(second.container.querySelectorAll("path")).toHaveLength(3)
  })

  it("draws a different face for a different seed", () => {
    const first = render(<AgentAvatar seed="nova" />)
    const markup = first.container.innerHTML
    first.unmount()
    const second = render(<AgentAvatar seed="orion" />)
    expect(second.container.innerHTML).not.toBe(markup)
  })

  it("uses only theme tokens for its colours", () => {
    const { container } = render(<AgentAvatar seed="nova" />)
    const fills = Array.from(container.querySelectorAll("path, circle"), (node) => node.getAttribute("fill"))
    expect(fills.every((fill) => fill?.startsWith("var(--"))).toBe(true)
  })

  it("takes its size from the prop", () => {
    render(<AgentAvatar seed="nova" size={64} />)
    const svg = screen.getByRole("img")
    expect(svg).toHaveAttribute("width", "64")
    expect(svg).toHaveAttribute("height", "64")
  })

  it("names the agent for assistive tech, or uses the given label", () => {
    const { rerender } = render(<AgentAvatar seed="nova" />)
    expect(screen.getByRole("img", { name: "Agent nova" })).toHaveAttribute("data-slot", "agent-avatar")
    rerender(<AgentAvatar seed="nova" label="Research assistant" />)
    expect(screen.getByRole("img", { name: "Research assistant" })).toBeInTheDocument()
  })
})
