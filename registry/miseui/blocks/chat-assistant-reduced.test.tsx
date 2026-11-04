import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatAssistant, type ChatMessage } from "./chat-assistant"

/** motion reads the preference once per module, so this lives in its own file with the mock in place before the first render. */
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const THREAD: readonly ChatMessage[] = [{ id: "1", role: "user", text: "How many invoices are overdue?" }]

describe("ChatAssistant popup under reduced motion", () => {
  it("leaves the layout at once when closed, with no exit to wait for", async () => {
    const { container } = render(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveClass("flex")
    await userEvent.click(screen.getByRole("button", { name: "Close chat" }))
    expect(container.querySelector('[role="dialog"]')).toHaveClass("hidden")
  })
})
