import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Heart } from "lucide-react"
import { IconButton, type IconButtonVariant } from "./icon-button"

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

describe("IconButton name", () => {
  it("is named by the label and hides nothing from the role", () => {
    render(
      <IconButton label="Save">
        <Heart />
      </IconButton>,
    )
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button")
  })

  it("refuses to compile without a name", () => {
    // The directives are the test: tsc fails the run if either stops being an error.
    // @ts-expect-error label is required
    const nameless = <IconButton><Heart /></IconButton>
    // @ts-expect-error aria-label is not a way around it
    const labelled = <IconButton aria-label="Save"><Heart /></IconButton>
    expect([nameless, labelled]).toHaveLength(2)
  })
})

describe("IconButton pending", () => {
  it("shows a spinner, blocks clicks and keeps focus on the button", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IconButton label="Save" pendingLabel="Saving" pending onClick={onClick}>
        <Heart data-testid="glyph" />
      </IconButton>,
    )
    const button = screen.getByRole("button", { name: "Saving" })
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).not.toBeDisabled()
    expect(screen.queryByTestId("glyph")).toBeNull()
    expect(button.querySelector("[data-slot='icon-button-spinner']")).not.toBeNull()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
    await user.tab({ shift: true })
    await user.tab()
    expect(button).toHaveFocus()
  })

  it("clicks and fires with the keyboard once it is done", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IconButton label="Save" onClick={onClick}>
        <Heart />
      </IconButton>,
    )
    await user.tab()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("stays out of the tab order when truly disabled", async () => {
    const user = userEvent.setup()
    render(
      <IconButton label="Save" disabled>
        <Heart />
      </IconButton>,
    )
    await user.tab()
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveFocus()
  })
})

describe("IconButton variants and sizes", () => {
  const expected: Record<IconButtonVariant, string> = {
    ghost: "text-muted-foreground",
    outline: "border",
    solid: "rounded-full",
    soft: "rounded-lg",
  }

  it.each(Object.keys(expected) as IconButtonVariant[])("%s has its own surface", (variant) => {
    render(
      <IconButton label="Save" variant={variant}>
        <Heart />
      </IconButton>,
    )
    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toHaveAttribute("data-variant", variant)
    expect(button).toHaveClass(expected[variant])
  })

  it("reaches 40 px on touch without growing the small button", () => {
    render(
      <IconButton label="Save" size="sm">
        <Heart />
      </IconButton>,
    )
    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toHaveClass("size-8", "pointer-coarse:after:size-10")
    expect(button).not.toHaveClass("pointer-coarse:size-10")
  })

  it("presses deeper with the effect", () => {
    render(
      <IconButton label="Save" effect="press">
        <Heart />
      </IconButton>,
    )
    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toHaveAttribute("data-effect", "press")
    expect(button).toHaveClass("active:scale-[0.88]")
  })
})

describe("IconButton tooltip", () => {
  it("shows the label on focus when asked", async () => {
    const user = userEvent.setup()
    render(
      <IconButton label="Add to favourites" tooltip>
        <Heart />
      </IconButton>,
    )
    expect(screen.queryByRole("tooltip")).toBeNull()
    await user.tab()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Add to favourites")
  })

  it("renders no tooltip by default", async () => {
    const user = userEvent.setup()
    render(
      <IconButton label="Save">
        <Heart />
      </IconButton>,
    )
    await user.tab()
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
})
