import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sheet, resolveSheetRest } from "./sheet"

describe("resolveSheetRest", () => {
  const height = 400

  it("stays open after a short, slow drag", () => {
    expect(resolveSheetRest({ offset: 40, velocity: 0, height })).toBe("open")
  })

  it("dismisses when the projected rest point passes half the sheet", () => {
    expect(resolveSheetRest({ offset: 120, velocity: 900, height })).toBe("closed")
  })

  it("dismisses on a fast flick even from a small offset", () => {
    expect(resolveSheetRest({ offset: 10, velocity: 1600, height })).toBe("closed")
  })

  it("never dismisses on an upward flick", () => {
    expect(resolveSheetRest({ offset: 150, velocity: -2000, height })).toBe("open")
  })
})

describe("Sheet", () => {
  it("renders a modal dialog with its title when open", () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Share">
        <p>Body</p>
      </Sheet>,
    )
    const dialog = screen.getByRole("dialog", { name: "Share" })
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveAttribute("data-slot", "sheet")
    expect(screen.getByText("Body")).toBeInTheDocument()
  })

  it("renders nothing when closed", () => {
    render(
      <Sheet open={false} onOpenChange={() => {}} title="Share">
        <p>Body</p>
      </Sheet>,
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("asks to close on Escape and on tapping the scrim", async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="Share">
        <p>Body</p>
      </Sheet>,
    )
    await userEvent.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await userEvent.click(screen.getByTestId("sheet-scrim"))
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })
})
