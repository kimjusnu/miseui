import { render, screen } from "@testing-library/react"
import { act } from "react"
import { Inbox } from "lucide-react"
import { Empty, type EmptyVariant } from "./empty"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly EmptyVariant[] = ["plain", "dashed", "card", "compact"]
const root = (container: HTMLElement) => container.querySelector("[data-slot='empty']") as HTMLElement

function Sample(props: Partial<React.ComponentProps<typeof Empty>>) {
  return (
    <Empty
      icon={<Inbox />}
      title="No invoices yet"
      description="Invoices appear here once a customer pays."
      actions={<button type="button">Create invoice</button>}
      {...props}
    />
  )
}

describe("Empty", () => {
  it.each(VARIANTS)("%s renders every part", (variant) => {
    const { container } = render(<Sample variant={variant} />)
    expect(root(container)).toHaveAttribute("data-variant", variant)
    expect(screen.getByRole("heading", { name: "No invoices yet" })).toBeInTheDocument()
    expect(screen.getByText("Invoices appear here once a customer pays.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create invoice" })).toBeInTheDocument()
    expect(container.querySelector("[data-slot='empty-icon']")).toHaveAttribute("aria-hidden", "true")
  })

  it("lays the variants out differently", () => {
    const classes = VARIANTS.map((variant) => {
      const { container, unmount } = render(<Sample variant={variant} />)
      const value = root(container).className
      unmount()
      return value
    })
    expect(new Set(classes).size).toBe(VARIANTS.length)
    expect(classes[0]).toContain("text-center")
    expect(classes[1]).toContain("border-dashed")
    expect(classes[2]).toContain("bg-card")
    expect(classes[3]).toContain("flex-wrap")
  })

  it("leaves out the parts it was not given", () => {
    const { container } = render(<Empty title="Nothing here" />)
    expect(container.querySelector("[data-slot='empty-icon']")).toBeNull()
    expect(container.querySelector("[data-slot='empty-actions']")).toBeNull()
    expect(container.querySelector("p")).toBeNull()
  })

  it("uses the heading level the page outline needs", () => {
    render(<Sample headingLevel={2} />)
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("No invoices yet")
  })

  it("announces only when asked", () => {
    const quiet = render(<Sample />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    quiet.unmount()
    render(<Sample announce />)
    expect(screen.getByRole("status")).toHaveTextContent("No invoices yet")
  })

  it("materialize still renders the same content, and passes attributes to the root", () => {
    const { container } = render(<Sample effect="materialize" variant="card" id="invoices-empty" />)
    expect(root(container)).toHaveAttribute("data-effect", "materialize")
    expect(root(container)).toHaveAttribute("id", "invoices-empty")
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })

  it("materialize skips the blur when motion is reduced", () => {
    setReducedMotion(true)
    const { container } = render(<Sample effect="materialize" />)
    expect(root(container).style.filter).toBe("")
  })
})
