import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { ScreenFrame, displayAddress } from "./screen-frame"

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

const SRC = "data:image/gif;base64,R0lGODlhAQABAAAAACw="
const slot = (name: string) => document.querySelector(`[data-slot='screen-frame-${name}']`) as HTMLElement

describe("ScreenFrame", () => {
  it("frames a screenshot lazily, with its alt text and caption", () => {
    render(<ScreenFrame src={SRC} alt="Orders table with two rows" caption="The orders screen after the redesign" />)
    const image = screen.getByRole("img", { name: "Orders table with two rows" })
    expect(image).toHaveAttribute("loading", "lazy")
    // A figcaption names its figure in browsers; the name calculation in jsdom does not know that.
    expect(screen.getByText("The orders screen after the redesign").tagName).toBe("FIGCAPTION")
    expect(screen.getByRole("figure")).toContainElement(image)
  })

  it("loads straight away when asked, for the first screen of a page", () => {
    render(<ScreenFrame src={SRC} alt="Home" eager />)
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager")
  })

  it("frames live interface passed as children", () => {
    render(
      <ScreenFrame>
        <button type="button">Invite</button>
      </ScreenFrame>,
    )
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument()
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("builds a different frame for each variant", () => {
    const { rerender } = render(<ScreenFrame src={SRC} alt="Home" url="https://example.com/orders/" variant="browser" />)
    expect(slot("address")).toHaveTextContent("example.com/orders")
    expect(slot("screen").className).toContain("aspect-video")

    rerender(<ScreenFrame src={SRC} alt="Home" url="https://example.com" variant="phone" />)
    expect(slot("address")).toBeNull()
    expect(slot("screen").className).toContain("aspect-[9/19.5]")
    expect(slot("body").className).toContain("max-w-60")

    rerender(<ScreenFrame src={SRC} alt="Home" url="https://example.com" variant="plain" />)
    expect(slot("address")).toBeNull()
    expect(slot("body").className).toContain("ring-1")
  })

  it("shows the alt text in place of an image that fails to load", () => {
    render(<ScreenFrame src="/missing.png" alt="Orders table" />)
    fireEvent.error(screen.getByRole("img"))
    expect(screen.queryByRole("img")).toBeNull()
    expect(slot("fallback")).toHaveTextContent("Orders table")
  })

  it("lets the screen shape be changed", () => {
    render(<ScreenFrame src={SRC} alt="Home" screenClassName="aspect-square" />)
    expect(slot("screen").className).toContain("aspect-square")
    expect(slot("screen").className).not.toContain("aspect-video")
  })

  it("tilts until seen with the settle effect, and stays flat when motion is off", async () => {
    const { rerender, unmount } = render(<ScreenFrame src={SRC} alt="Home" effect="settle" />)
    expect(slot("body").style.transform).toContain("rotateX(10deg)")
    state.inView = true
    rerender(<ScreenFrame src={SRC} alt="Home" effect="settle" />)
    await waitFor(() => expect(slot("body").style.transform).not.toContain("rotateX(10deg)"))
    unmount()

    state.reduced = true
    state.inView = false
    render(<ScreenFrame src={SRC} alt="Home" effect="settle" />)
    expect(slot("body").style.transform).not.toContain("rotateX")
  })

  it("strips the protocol and a trailing slash from an address", () => {
    expect(displayAddress("https://shop.example.com/")).toBe("shop.example.com")
    expect(displayAddress("http://localhost:3000/a/b")).toBe("localhost:3000/a/b")
    expect(displayAddress("example.com")).toBe("example.com")
  })
})
