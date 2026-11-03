import { useState } from "react"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  StationDialog,
  StationDialogContent,
  StationDialogTrigger,
  type StationDialogProps,
  type StationDialogVariant,
} from "./station-dialog"
import { morphOffset, pinPosition, type OriginBox } from "./station-dialog-geometry"

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
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly StationDialogVariant[] = ["card", "side", "pin"]

function Stations(props: StationDialogProps) {
  return (
    <StationDialog {...props}>
      <StationDialogTrigger value="harbor">Harbor Street</StationDialogTrigger>
      <StationDialogTrigger value="market">Market Square</StationDialogTrigger>
      <StationDialogContent title="Harbor Street" meta="Line 2">
        <p>Lifts at both ends.</p>
      </StationDialogContent>
    </StationDialog>
  )
}

function box(left: number, top: number, width = 40, height = 40): OriginBox {
  return { left, top, width, height, right: left + width, bottom: top + height }
}

const SCREEN = { width: 1000, height: 800 }
const NOTE = { width: 320, height: 200 }

describe("station dialog geometry", () => {
  it("measures the trip from the centre of the screen to the point", () => {
    expect(morphOffset(box(80, 80), SCREEN)).toEqual({ x: -400, y: -300 })
    expect(morphOffset(box(480, 380), SCREEN)).toEqual({ x: 0, y: 0 })
  })

  it("pins to the right of the point when there is room, growing from the near edge", () => {
    expect(pinPosition(box(100, 300), NOTE, SCREEN)).toEqual({ left: 152, top: 220, originX: 0, originY: 100 })
  })

  it("flips to the left near the right edge", () => {
    const place = pinPosition(box(900, 300), NOTE, SCREEN)
    expect(place.left).toBe(568)
    expect(place.originX).toBe(320)
  })

  it("goes under or over when neither side has room, as on a phone", () => {
    const phone = { width: 375, height: 700 }
    const under = pinPosition(box(160, 100), NOTE, phone)
    expect(under.top).toBe(152)
    expect(under.originY).toBe(0)
    const over = pinPosition(box(160, 600), NOTE, phone)
    expect(over.top).toBe(388)
    expect(over.originY).toBe(200)
    expect(over.left).toBeGreaterThanOrEqual(16)
    expect(over.left + NOTE.width).toBeLessThanOrEqual(phone.width - 16)
  })

  it("stays on screen beside a point at the very top", () => {
    expect(pinPosition(box(100, 0), NOTE, SCREEN).top).toBe(16)
  })
})

describe("StationDialog", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("opens from a trigger as a named dialog and sends focus back there on Escape", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Stations variant={variant} onValueChange={onValueChange} />)
      const trigger = screen.getByRole("button", { name: "Market Square" })
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
      expect(screen.queryByRole("dialog")).toBeNull()
      await user.click(trigger)
      expect(onValueChange).toHaveBeenLastCalledWith("market")
      const dialog = screen.getByRole("dialog", { name: "Harbor Street" })
      expect(dialog).toHaveAttribute("data-slot", "station-dialog")
      expect(dialog).toHaveAttribute("data-variant", variant)
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
      expect(within(dialog).getByText("Line 2")).toBeInTheDocument()
      await user.keyboard("{Escape}")
      expect(onValueChange).toHaveBeenLastCalledWith(null)
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 })
      await waitFor(() => expect(screen.getByRole("button", { name: "Market Square", hidden: true })).toHaveFocus())
    })

    it("closes from the close button", async () => {
      const user = userEvent.setup()
      render(<Stations variant={variant} />)
      await user.click(screen.getByRole("button", { name: "Harbor Street" }))
      await user.click(screen.getByRole("button", { name: "Close" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 })
    })
  })

  it("builds each variant differently", async () => {
    const user = userEvent.setup()
    const shape = async (variant: StationDialogVariant) => {
      setReducedMotion(true)
      const { unmount } = render(<Stations variant={variant} />)
      await user.click(screen.getByRole("button", { name: "Harbor Street" }))
      const dialog = screen.getByRole("dialog")
      const found = {
        // An accent bar on top of a card is decoration: it says nothing the title does not.
        rule: dialog.querySelector("[data-slot='station-dialog-rule']") !== null,
        side: dialog.classList.contains("right-0"),
        pinned: dialog.style.left !== "",
      }
      unmount()
      return found
    }
    expect(await shape("card")).toEqual({ rule: false, side: false, pinned: false })
    expect(await shape("side")).toEqual({ rule: false, side: true, pinned: false })
    expect(await shape("pin")).toEqual({ rule: false, side: false, pinned: true })
  })

  it("keeps its content while it animates out, when the owner has already cleared the value", async () => {
    const user = userEvent.setup()
    function Owned() {
      const [value, setValue] = useState<string | null>(null)
      return (
        <StationDialog value={value} onValueChange={setValue}>
          <StationDialogTrigger value="harbor">Open</StationDialogTrigger>
          <StationDialogContent title={value ?? "gone"}>{value ?? "gone"}</StationDialogContent>
        </StationDialog>
      )
    }
    render(<Owned />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(screen.getByRole("dialog", { name: "harbor" })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    expect(screen.queryByText("gone")).toBeNull()
  })

  it("returns focus to an origin the owner passed, when nothing was pressed", async () => {
    const user = userEvent.setup()
    function FromMap() {
      const [origin, setOrigin] = useState<HTMLElement | null>(null)
      const [value, setValue] = useState<string | null>(null)
      return (
        <>
          <button
            type="button"
            onClick={(event) => {
              setOrigin(event.currentTarget)
              setValue("point")
            }}
          >
            Map point
          </button>
          <StationDialog value={value} onValueChange={setValue} origin={origin} effect="morph">
            <StationDialogContent title="Point">Details</StationDialogContent>
          </StationDialog>
        </>
      )
    }
    render(<FromMap />)
    await user.click(screen.getByRole("button", { name: "Map point" }))
    expect(screen.getByRole("dialog", { name: "Point" })).toHaveAttribute("data-effect", "morph")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(screen.getByRole("button", { name: "Map point", hidden: true })).toHaveFocus())
  })

  it("renders a trigger onto the owner's element with asChild", async () => {
    const user = userEvent.setup()
    render(
      <StationDialog>
        <StationDialogTrigger value="harbor" asChild>
          <a href="#harbor">Harbor</a>
        </StationDialogTrigger>
        <StationDialogContent title="Harbor">Details</StationDialogContent>
      </StationDialog>,
    )
    await user.click(screen.getByRole("link", { name: "Harbor" }))
    expect(screen.getByRole("dialog", { name: "Harbor" })).toBeInTheDocument()
  })

  it("respects a click handler that cancels opening", async () => {
    const user = userEvent.setup()
    render(
      <StationDialog>
        <StationDialogTrigger value="harbor" onClick={(event) => event.preventDefault()}>Harbor</StationDialogTrigger>
        <StationDialogContent title="Harbor">Details</StationDialogContent>
      </StationDialog>,
    )
    await user.click(screen.getByRole("button", { name: "Harbor" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("refuses to render its parts outside the root", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<StationDialogTrigger value="x">Lost</StationDialogTrigger>)).toThrow(/inside <StationDialog>/)
    error.mockRestore()
  })
})
