import { render, screen, waitFor } from "@testing-library/react"
import { Materialize } from "./materialize"


describe("Materialize", () => {
  it("renders children when shown, with a transform origin", () => {
    render(
      <Materialize show origin="top left">
        <p>Panel</p>
      </Materialize>,
    )
    const surface = screen.getByText("Panel").parentElement
    expect(surface).toHaveAttribute("data-slot", "materialize")
    expect(surface).toHaveStyle({ transformOrigin: "top left" })
  })

  it("renders nothing when hidden from the start", () => {
    render(
      <Materialize show={false}>
        <p>Panel</p>
      </Materialize>,
    )
    expect(screen.queryByText("Panel")).not.toBeInTheDocument()
  })

  it("removes the surface after show turns false", async () => {
    const { rerender } = render(
      <Materialize show>
        <p>Panel</p>
      </Materialize>,
    )
    rerender(
      <Materialize show={false}>
        <p>Panel</p>
      </Materialize>,
    )
    await waitFor(() => expect(screen.queryByText("Panel")).not.toBeInTheDocument())
  })

  it("marks reduced motion so only opacity animates", async () => {
    // motion caches the media query on first use, so mock its hook for a fresh module graph.
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const { Materialize: FreshMaterialize } = await import("./materialize")
    vi.doUnmock("motion/react")
    render(
      <FreshMaterialize show>
        <p>Panel</p>
      </FreshMaterialize>,
    )
    expect(screen.getByText("Panel").parentElement).toHaveAttribute("data-reduced", "true")
  })
})
