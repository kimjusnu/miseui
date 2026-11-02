import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HoverCard, HoverCardContent, HoverCardTrigger, sparklinePoints, type HoverCardContentProps } from "./hover-card"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function Card(props: HoverCardContentProps) {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger href="/profile">Priya</HoverCardTrigger>
      <HoverCardContent data-testid="card" {...props} />
    </HoverCard>
  )
}

async function open(props: HoverCardContentProps) {
  const user = userEvent.setup()
  render(<Card {...props} />)
  await user.hover(screen.getByRole("link", { name: "Priya" }))
  return { user, card: await screen.findByTestId("card") }
}

const part = (root: HTMLElement, name: string) => root.querySelector(`[data-part="${name}"]`)

describe("sparklinePoints", () => {
  it("runs left to right and draws the highest value at the top", () => {
    const points = sparklinePoints([0, 10], 100, 20, 0).split(" ")
    expect(points).toEqual(["0,20", "100,0"])
  })

  it("keeps a flat series on the middle line instead of dividing by zero", () => {
    expect(sparklinePoints([5, 5, 5], 100, 20)).toBe("0,10 50,10 100,10")
  })

  it("draws nothing for fewer than two values", () => {
    expect(sparklinePoints([5], 100, 20)).toBe("")
    expect(sparklinePoints([], 100, 20)).toBe("")
  })
})

describe("HoverCard behaviour", () => {
  it("opens on hover and closes when the pointer leaves", async () => {
    const { user } = await open({ children: "Staff designer in Lisbon" })
    expect(screen.getByTestId("card")).toHaveTextContent("Staff designer in Lisbon")
    await user.unhover(screen.getByRole("link", { name: "Priya" }))
    await waitFor(() => expect(screen.queryByTestId("card")).not.toBeInTheDocument())
  })

  it("opens on keyboard focus, so it is not hover only", async () => {
    const user = userEvent.setup()
    render(<Card>Staff designer in Lisbon</Card>)
    await user.tab()
    expect(screen.getByRole("link", { name: "Priya" })).toHaveFocus()
    expect(await screen.findByTestId("card")).toBeInTheDocument()
  })

  it("closes with Escape", async () => {
    const { user } = await open({ children: "Staff designer in Lisbon" })
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByTestId("card")).not.toBeInTheDocument())
  })

  it("does not open for a touch pointer, where hover does not exist", async () => {
    render(<Card>Staff designer in Lisbon</Card>)
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Priya" }), { pointerType: "touch" })
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByTestId("card")).not.toBeInTheDocument()
  })

  it("passes panel attributes through and keeps body fields off the DOM", async () => {
    const { card } = await open({ variant: "stat", label: "Requests", value: "4,120", "aria-label": "Request stats" })
    expect(card).toHaveAttribute("aria-label", "Request stats")
    expect(card).not.toHaveAttribute("value")
    expect(card).not.toHaveAttribute("label")
    expect(card).toHaveAttribute("data-slot", "hover-card-content")
  })
})

describe("HoverCard designs", () => {
  it("plain is free content in a narrow panel", async () => {
    const { card } = await open({ children: <em>Anything</em> })
    expect(card).toHaveAttribute("data-variant", "plain")
    expect(card).toHaveClass("w-64", "p-4")
    expect(card.querySelector("em")).toHaveTextContent("Anything")
  })

  it("profile lays out identity, bio and facts as a definition list", async () => {
    const { card } = await open({
      variant: "profile",
      name: "Priya Raman",
      handle: "@priya",
      avatar: <span data-testid="avatar" />,
      bio: "Staff designer in Lisbon.",
      facts: [{ label: "Followers", value: "1,204" }],
    })
    expect(part(card, "profile")).not.toBeNull()
    expect(screen.getByTestId("avatar")).toBeInTheDocument()
    expect(card.querySelector("dd")).toHaveTextContent("1,204")
    expect(card.querySelector("dt")).toHaveTextContent("Followers")
  })

  it("link-preview bleeds its media to the card edge", async () => {
    const { card } = await open({
      variant: "link-preview",
      title: "Designing for hover",
      domain: "northwind.dev",
      media: <img alt="" src="data:," />,
    })
    expect(card).toHaveClass("p-0", "overflow-hidden")
    expect(part(card, "media")).toHaveClass("aspect-2/1")
    expect(card).toHaveTextContent("northwind.dev")
  })

  it("stat leads with the number and draws a trend only when given one", async () => {
    const { card } = await open({ variant: "stat", label: "Requests", value: "4,120", change: "Up 12%", trend: [1, 3, 2] })
    expect(card).toHaveTextContent("4,120")
    expect(screen.getByText("4,120")).toHaveClass("text-2xl")
    expect(part(card, "trend")?.querySelector("polyline")).toHaveAttribute("points")
  })

  it("stat leaves the trend out for one value", async () => {
    const { card } = await open({ variant: "stat", label: "Requests", value: "4,120", trend: [1] })
    expect(part(card, "trend")).toBeNull()
  })
})

describe("HoverCard materialize effect", () => {
  it("grows from the Radix origin with a mirrored exit", async () => {
    const { card } = await open({ effect: "materialize", children: "Hello" })
    expect(card).toHaveAttribute("data-effect", "materialize")
    expect(card).toHaveClass("origin-(--radix-hover-card-content-transform-origin)")
    expect(card).toHaveClass("zoom-in-90", "blur-in-sm", "zoom-out-90", "blur-out-sm")
  })

  it("drops scale under reduced motion and blur under reduced transparency", async () => {
    const { card } = await open({ effect: "materialize", children: "Hello" })
    expect(card).toHaveClass("motion-reduce:zoom-in-100", "motion-reduce:blur-in-0")
    expect(card).toHaveClass("[@media(prefers-reduced-transparency:reduce)]:blur-in-0")
  })

  it("keeps the plain entrance without the prop", async () => {
    const { card } = await open({ children: "Hello" })
    expect(card).not.toHaveAttribute("data-effect")
    expect(card).toHaveClass("data-[state=open]:zoom-in-95")
    expect(card).not.toHaveClass("blur-in-sm")
  })
})
