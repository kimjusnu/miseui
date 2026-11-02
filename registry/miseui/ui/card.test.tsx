import { createRef } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for "change",
 * so the mock goes in before the first render and flips the preference by firing that listener.
 */
const originalMatchMedia = window.matchMedia
let reducedMotion = false
let finePointer = true
const changeListeners: Array<() => void> = []

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reducedMotion : finePointer
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  changeListeners.forEach((listener) => listener())
}

afterEach(() => {
  setReducedMotion(false)
  finePointer = true
})

/** A 200 × 100 card at (10, 20), with the pointer at its right edge and vertical middle. */
function pointAtRightEdge(card: HTMLElement) {
  vi.spyOn(card, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 200, 100))
  fireEvent.pointerMove(card, { clientX: 210, clientY: 70 })
}

const wait = () => new Promise((resolve) => setTimeout(resolve, 60))

function renderFullCard() {
  return render(
    <Card data-testid="card">
      <CardHeader>
        <CardTitle>Project</CardTitle>
        <CardDescription>Three open tasks</CardDescription>
        <CardAction>
          <button type="button">Edit</button>
        </CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  )
}

describe("Card", () => {
  it("marks every piece with its own slot", () => {
    renderFullCard()
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card")
    expect(screen.getByText("Project")).toHaveAttribute("data-slot", "card-title")
    expect(screen.getByText("Three open tasks")).toHaveAttribute("data-slot", "card-description")
    expect(screen.getByRole("button", { name: "Edit" }).parentElement).toHaveAttribute(
      "data-slot",
      "card-action",
    )
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content")
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer")
  })

  it("keeps header, content and footer inside the card region", () => {
    renderFullCard()
    const card = screen.getByTestId("card")
    expect(card).toContainElement(screen.getByText("Project"))
    expect(card).toContainElement(screen.getByText("Body"))
    expect(card).toContainElement(screen.getByText("Footer"))
    expect(screen.getByText("Project").closest("[data-slot='card-header']")).not.toBeNull()
  })

  it("merges a custom className instead of appending a conflicting one", () => {
    render(
      <Card data-testid="card" className="p-0">
        Tight
      </Card>,
    )
    const card = screen.getByTestId("card")
    expect(card).toHaveClass("p-0", "rounded-xl")
    expect(card).not.toHaveClass("py-6")
  })

  it("forwards native attributes so the region can be named", () => {
    render(
      <Card role="region" aria-label="Billing">
        <CardContent>Plan</CardContent>
      </Card>,
    )
    expect(screen.getByRole("region", { name: "Billing" })).toHaveTextContent("Plan")
  })

  it("adds no effect attribute by default", () => {
    render(<Card data-testid="card">Plain</Card>)
    expect(screen.getByTestId("card")).not.toHaveAttribute("data-effect")
  })
})

describe("Card effect=beam", () => {
  it("makes the card itself the beam's root, with no wrapper around it", () => {
    const { container } = render(
      <Card data-testid="card" effect="beam" className="w-full">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    expect(card.parentElement).toBe(container)
    expect(card).toHaveAttribute("data-slot", "card")
    expect(card).toHaveAttribute("data-effect", "beam")
    expect(card).toHaveClass("w-full", "rounded-xl", "border-transparent")
    expect(card).toContainElement(screen.getByTestId("beam-layer"))
  })

  it("keeps the consumer's ref on the card", () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Card data-testid="card" effect="beam" ref={ref}>
        Body
      </Card>,
    )
    expect(ref.current).toBe(screen.getByTestId("card"))
  })
})

describe("Card effect=spotlight", () => {
  it("writes the pointer position as CSS variables on the card", () => {
    render(
      <Card data-testid="card" effect="spotlight">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    expect(card).toHaveAttribute("data-effect", "spotlight")
    pointAtRightEdge(card)
    expect(card.style.getPropertyValue("--spot-x")).toBe("200px")
    expect(card.style.getPropertyValue("--spot-y")).toBe("50px")
  })

  it("does not re-render its children for a pointer stream", () => {
    const renders = vi.fn()
    function Child() {
      renders()
      return <span>Body</span>
    }
    render(
      <Card data-testid="card" effect="spotlight">
        <Child />
      </Card>,
    )
    expect(renders).toHaveBeenCalledTimes(1)
    pointAtRightEdge(screen.getByTestId("card"))
    pointAtRightEdge(screen.getByTestId("card"))
    expect(renders).toHaveBeenCalledTimes(1)
  })

  it("draws a fill and a rim that read those variables, invisible until hover", () => {
    render(<Card effect="spotlight">Body</Card>)
    for (const layer of [screen.getByTestId("card-spot"), screen.getByTestId("card-spot-rim")]) {
      expect(layer).toHaveClass("opacity-0", "group-hover/card:opacity-100", "pointer-events-none")
      expect(layer.style.background).toContain("var(--spot-x, 50%)")
    }
  })

  it("rests the highlight on the top edge under reduced motion", () => {
    setReducedMotion(true)
    render(
      <Card data-testid="card" effect="spotlight">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    pointAtRightEdge(card)
    expect(card.style.getPropertyValue("--spot-x")).toBe("")
  })

  it("ignores a coarse pointer but still calls the consumer's handler", () => {
    finePointer = false
    const onPointerMove = vi.fn()
    render(
      <Card data-testid="card" effect="spotlight" onPointerMove={onPointerMove}>
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    pointAtRightEdge(card)
    expect(card.style.getPropertyValue("--spot-x")).toBe("")
    expect(onPointerMove).toHaveBeenCalledTimes(1)
  })
})

describe("Card effect=tilt", () => {
  it("brings the edge under the pointer forward, on one spring per axis, up to 3 degrees", async () => {
    render(
      <Card data-testid="card" effect="tilt">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    expect(card).toHaveAttribute("data-slot", "card")
    expect(card).toHaveAttribute("data-effect", "tilt")
    pointAtRightEdge(card)
    await waitFor(() => expect(card.style.transform).toContain("rotateY(-"))
    expect(card.style.transform).toContain("perspective(900px)")
    await waitFor(() => expect(card.style.transform).toMatch(/rotateY\(-2\.\d+deg\)|rotateY\(-3deg\)/))
    expect(card.style.transform).not.toContain("rotateX(")
    expect(card.style.getPropertyValue("--spot-x")).toBe("200px")
  })

  it("settles back when the pointer leaves", async () => {
    const onPointerLeave = vi.fn()
    render(
      <Card data-testid="card" effect="tilt" onPointerLeave={onPointerLeave}>
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    pointAtRightEdge(card)
    await waitFor(() => expect(card.style.transform).toContain("rotateY(-"))
    fireEvent.pointerLeave(card)
    expect(onPointerLeave).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(card.style.transform).not.toContain("rotateY(-"))
  })

  it("does nothing under reduced motion", async () => {
    setReducedMotion(true)
    render(
      <Card data-testid="card" effect="tilt">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    pointAtRightEdge(card)
    await wait()
    expect(card.style.transform).not.toContain("rotateY")
    expect(card.style.getPropertyValue("--spot-x")).toBe("")
  })

  it("does nothing on a coarse pointer", async () => {
    finePointer = false
    render(
      <Card data-testid="card" effect="tilt">
        Body
      </Card>,
    )
    const card = screen.getByTestId("card")
    pointAtRightEdge(card)
    await wait()
    expect(card.style.transform).not.toContain("rotateY")
  })
})

describe("Card effect=materialize", () => {
  it("arrives through Materialize, with the card itself as its surface", async () => {
    render(
      <Card data-testid="card" effect="materialize" className="w-full">
        Body
      </Card>,
    )
    const card = await screen.findByTestId("card")
    expect(card).toHaveAttribute("data-slot", "card")
    expect(card).toHaveAttribute("data-effect", "materialize")
    expect(card).toHaveAttribute("data-reduced", "false")
    expect(card).toHaveClass("w-full", "rounded-xl", "will-change-[transform,opacity,filter]")
    expect(card).toHaveTextContent("Body")
  })

  it("starts absent, so the flip to shown is what plays the arrival", async () => {
    render(
      <Card data-testid="card" effect="materialize">
        Body
      </Card>,
    )
    expect(screen.queryByTestId("card")).not.toBeInTheDocument()
    expect(await screen.findByTestId("card")).toBeInTheDocument()
  })

  it("falls back to Materialize's plain fade under reduced motion", async () => {
    setReducedMotion(true)
    render(
      <Card data-testid="card" effect="materialize">
        Body
      </Card>,
    )
    expect(await screen.findByTestId("card")).toHaveAttribute("data-reduced", "true")
  })
})
