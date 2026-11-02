import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatAssistant, type ChatMessage } from "./chat-assistant"

/**
 * motion's useReducedMotion reads matchMedia once per module and afterwards only listens for
 * "change", so the mock goes in before the first render and flips the preference by firing that listener.
 */
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
  changeListeners.forEach((listener) => listener())
}

afterEach(() => setReducedMotion(false))

const THREAD: readonly ChatMessage[] = [
  { id: "1", role: "user", text: "How many invoices are overdue?" },
  {
    id: "2",
    role: "assistant",
    text: "Twelve are overdue.",
    reasoning: [{ id: "a", label: "Read the ledger", status: "done" }],
    tools: [{ id: "t", name: "query_invoices", status: "success", durationMs: 300 }],
  },
]
const composer = () => screen.getByRole("textbox", { name: /message/i })

describe("ChatAssistant", () => {
  it("sends on Enter, trims and clears the field, and keeps Shift+Enter as a new line", async () => {
    const onSend = vi.fn()
    render(<ChatAssistant messages={THREAD} onSend={onSend} />)
    await userEvent.type(composer(), "  Draft a reminder{Shift>}{Enter}{/Shift}")
    expect(onSend).not.toHaveBeenCalled()
    await userEvent.type(composer(), "please{Enter}")
    expect(onSend).toHaveBeenCalledExactlyOnceWith("Draft a reminder\nplease")
    expect(composer()).toHaveValue("")
  })

  it("does not send while an input method is still composing a syllable", () => {
    const onSend = vi.fn()
    render(<ChatAssistant messages={THREAD} onSend={onSend} />)
    fireEvent.change(composer(), { target: { value: "안녕" } })
    fireEvent.keyDown(composer(), { key: "Enter", isComposing: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it("keeps Send disabled until there is something to send", async () => {
    render(<ChatAssistant messages={THREAD} />)
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled()
    await userEvent.type(composer(), "Hi")
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled()
  })

  it("turns the same button into Stop while generating, so keyboard focus survives", async () => {
    const onStop = vi.fn()
    const { rerender } = render(<ChatAssistant messages={THREAD} status="idle" onStop={onStop} />)
    const send = screen.getByRole("button", { name: "Send message" })
    rerender(<ChatAssistant messages={THREAD} status="generating" onStop={onStop} />)
    const stop = screen.getByRole("button", { name: "Stop generating" })
    expect(stop).toBe(send)
    await userEvent.click(stop)
    expect(onStop).toHaveBeenCalledOnce()
  })

  it("will not send a draft while generating", async () => {
    const onSend = vi.fn()
    render(<ChatAssistant messages={THREAD} status="generating" onSend={onSend} />)
    await userEvent.type(composer(), "Another question{Enter}")
    expect(onSend).not.toHaveBeenCalled()
    expect(composer()).toHaveValue("Another question")
  })

  it("lights the composer's beam only while generating", () => {
    const { rerender } = render(<ChatAssistant messages={THREAD} status="idle" />)
    expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
    rerender(<ChatAssistant messages={THREAD} status="generating" />)
    expect(screen.getByTestId("beam-layer")).toBeInTheDocument()
  })

  it("shows the reasoning and the tool call behind an answer", () => {
    render(<ChatAssistant messages={THREAD} />)
    expect(screen.getByText("Twelve are overdue.")).toBeInTheDocument()
    expect(screen.getByText("1 step · done")).toBeInTheDocument()
    expect(screen.getByLabelText("query_invoices: success")).toBeInTheDocument()
  })

  it("streams the turn being generated and keeps the reveal after it goes idle, but never replays history", () => {
    const { container, rerender } = render(<ChatAssistant messages={THREAD} status="idle" />)
    expect(container.querySelector('[data-slot="streaming-text"]')).toBeNull()
    rerender(<ChatAssistant messages={THREAD} status="generating" />)
    expect(container.querySelector('[data-slot="streaming-text"]')).not.toBeNull()
    rerender(<ChatAssistant messages={THREAD} status="idle" />)
    expect(container.querySelector('[data-slot="streaming-text"]')).not.toBeNull()
  })

  it("says it is working before the first word of a turn arrives", () => {
    render(<ChatAssistant messages={THREAD.slice(0, 1)} status="generating" />)
    expect(screen.getByRole("status")).toHaveTextContent("Thinking")
  })

  it("offers starter prompts when empty and sends the one picked", async () => {
    const onSend = vi.fn()
    render(<ChatAssistant messages={[]} onSend={onSend} suggestions={["Show overdue invoices"]} />)
    await userEvent.click(screen.getByRole("button", { name: "Show overdue invoices" }))
    expect(onSend).toHaveBeenCalledExactlyOnceWith("Show overdue invoices")
  })

  it("shows a failed turn above the composer and retries it", async () => {
    const onRetry = vi.fn()
    render(<ChatAssistant messages={THREAD} error="The model did not respond." onRetry={onRetry} />)
    expect(screen.getByRole("alert")).toHaveTextContent("The model did not respond.")
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("blocks new messages when disabled", () => {
    render(<ChatAssistant messages={[]} disabled suggestions={["Show overdue invoices"]} />)
    expect(composer()).toBeDisabled()
    expect(screen.getByRole("button", { name: "Show overdue invoices" })).toBeDisabled()
  })

  it("responds to its container, not the viewport", () => {
    const { container } = render(<ChatAssistant messages={THREAD} />)
    expect(container.querySelector('[data-slot="chat-assistant"]')).toHaveClass("@container")
  })

  describe("without messages", () => {
    it("runs a sample turn that can be stopped, then accepts a new message", async () => {
      const onSend = vi.fn()
      render(<ChatAssistant onSend={onSend} />)
      expect(screen.getByText("Why did churn jump in March?")).toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Stop generating" }))
      await userEvent.type(composer(), "And Team plans?{Enter}")
      expect(onSend).toHaveBeenCalledExactlyOnceWith("And Team plans?")
      expect(screen.getByText("And Team plans?")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument()
      expect(screen.getByText("3 steps · Reading your question")).toBeInTheDocument()
    })

    it("clears to the starter prompts on New chat", async () => {
      render(<ChatAssistant />)
      await userEvent.click(screen.getByRole("button", { name: "New chat" }))
      expect(screen.getByRole("heading", { name: /^What should we look at\?/ })).toBeInTheDocument()
    })

    it("hands back to Send when the sample turn finishes by itself", () => {
      vi.useFakeTimers()
      try {
        render(<ChatAssistant />)
        expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument()
        // Small steps: the reveal's timer only starts once React has committed the text it reveals.
        for (let step = 0; step < 200; step += 1) {
          act(() => {
            vi.advanceTimersByTime(100)
          })
        }
        expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument()
        expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
        expect(screen.getByText(/draft the two emails if you want\.$/)).toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })

    it("shows sample replies whole under reduced motion, with no turn left running", async () => {
      setReducedMotion(true)
      render(<ChatAssistant />)
      expect(screen.getByText(/^Start with Northgate Studio/)).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Stop generating" })).not.toBeInTheDocument()
      await userEvent.type(composer(), "And Team plans?{Enter}")
      expect(screen.getByText(/^This is a preview reply/)).toBeInTheDocument()
      expect(screen.queryByTestId("beam-layer")).not.toBeInTheDocument()
    })
  })
})
