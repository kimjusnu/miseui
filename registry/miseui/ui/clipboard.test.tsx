import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { Clipboard, copyText, type ClipboardVariant } from "./clipboard"

const VARIANTS: readonly ClipboardVariant[] = ["icon", "inline", "field", "block"]
const COMMAND = "pnpm dlx shadcn add clipboard"

function stubClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

const copyButton = () => screen.getByRole("button", { name: "Copy" })
const root = (container: HTMLElement) => container.querySelector("[data-slot='clipboard']") as HTMLElement

afterEach(() => {
  vi.useRealTimers()
  stubClipboard(undefined)
})

describe("copyText", () => {
  it("writes the text and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    await expect(copyText("hello")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("hello")
  })

  it("reports failure instead of throwing when the API is missing or refuses", async () => {
    stubClipboard(undefined)
    await expect(copyText("hello")).resolves.toBe(false)
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
    await expect(copyText("hello")).resolves.toBe(false)
  })
})

describe("Clipboard", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("copies the exact value, shows the check state and announces it", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      const onCopied = vi.fn()
      stubClipboard(writeText)
      const { container } = render(<Clipboard variant={variant} value={COMMAND} onCopied={onCopied} />)
      expect(root(container)).toHaveAttribute("data-variant", variant)
      fireEvent.click(copyButton())
      await waitFor(() => expect(root(container)).toHaveAttribute("data-state", "copied"))
      expect(writeText).toHaveBeenCalledWith(COMMAND)
      expect(onCopied).toHaveBeenCalledOnce()
      expect(screen.getByRole("status")).toHaveTextContent("Copied")
    })

    it("lands in a failure state that says so when the browser refuses", async () => {
      const onFailed = vi.fn()
      stubClipboard(vi.fn().mockRejectedValue(new Error("denied")))
      const { container } = render(<Clipboard variant={variant} value={COMMAND} onFailed={onFailed} />)
      fireEvent.click(copyButton())
      await waitFor(() => expect(root(container)).toHaveAttribute("data-state", "failed"))
      expect(onFailed).toHaveBeenCalledOnce()
      expect(screen.getByRole("status")).toHaveTextContent("Could not copy")
    })
  })

  it("has a different structure per variant", () => {
    const { rerender } = render(<Clipboard value={COMMAND} />)
    expect(screen.queryByText(COMMAND)).not.toBeInTheDocument()
    rerender(<Clipboard variant="inline" value={COMMAND} />)
    expect(screen.getByText(COMMAND).tagName).toBe("CODE")
    rerender(<Clipboard variant="field" value={COMMAND} />)
    expect(screen.getByRole("textbox", { name: "Text to copy" })).toHaveValue(COMMAND)
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly")
    rerender(<Clipboard variant="block" value={COMMAND} title="install.sh" />)
    expect(screen.getByText(COMMAND).tagName).toBe("PRE")
    expect(screen.getByText("install.sh")).toBeInTheDocument()
  })

  it("selects the field text on failure so it can be copied by hand", async () => {
    stubClipboard(undefined)
    render(<Clipboard variant="field" value={COMMAND} />)
    const field = screen.getByRole("textbox") as HTMLInputElement
    const select = vi.spyOn(field, "select")
    fireEvent.click(copyButton())
    await waitFor(() => expect(select).toHaveBeenCalled())
    expect(screen.getByRole("status")).not.toHaveClass("sr-only")
  })

  it("goes back to idle after resetAfter", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    const { container } = render(<Clipboard value={COMMAND} resetAfter={1000} />)
    fireEvent.click(copyButton())
    await vi.waitFor(() => expect(root(container)).toHaveAttribute("data-state", "copied"))
    act(() => vi.advanceTimersByTime(1100))
    expect(root(container)).toHaveAttribute("data-state", "idle")
  })

  it("does not copy while disabled", () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    render(<Clipboard value={COMMAND} disabled />)
    expect(copyButton()).toBeDisabled()
    fireEvent.click(copyButton())
    expect(writeText).not.toHaveBeenCalled()
  })

  it("morph keeps one glyph slot and marks the effect", () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    const { container } = render(<Clipboard value={COMMAND} effect="morph" />)
    expect(root(container)).toHaveAttribute("data-effect", "morph")
    expect(container.querySelector("[data-slot='clipboard-morph']")).not.toBeNull()
  })
})
