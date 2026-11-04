import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatAssistant, type ChatAssistantVariant, type ChatMessage } from "./chat-assistant"

const THREAD: readonly ChatMessage[] = [
  { id: "1", role: "user", text: "How many invoices are overdue?" },
  { id: "2", role: "assistant", text: "Twelve are overdue." },
]
const root = (container: HTMLElement) => container.querySelector('[data-slot="chat-assistant"]')
const composer = () => screen.getByRole("textbox", { name: /message/i })
const pageWork = <p>My spreadsheet</p>

describe("ChatAssistant variants", () => {
  it("renders full without the prop and for an unknown value", () => {
    const { container, rerender } = render(<ChatAssistant messages={THREAD} />)
    expect(root(container)).toHaveAttribute("data-variant", "full")
    const markup = container.innerHTML
    rerender(<ChatAssistant messages={THREAD} variant={"nonsense" as ChatAssistantVariant} />)
    expect(container.innerHTML).toBe(markup)
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<ChatAssistant messages={THREAD} variant="full" />)
    expect(screen.queryByRole("region", { name: "Your work" })).not.toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(<ChatAssistant messages={THREAD} variant="docked" />)
    expect(root(container)).toHaveAttribute("data-variant", "docked")
    expect(screen.getByRole("region", { name: "Your work" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Chat with Tally" })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
    expect(root(container)).toHaveAttribute("data-variant", "popup")
    expect(screen.getByRole("region", { name: "Your work" })).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Chat with Tally" })).toBeInTheDocument()
  })

  it("does not put panel props on the DOM node, and full ignores children", () => {
    const { container } = render(<ChatAssistant messages={THREAD} defaultOpen onOpenChange={() => undefined}>{pageWork}</ChatAssistant>)
    expect(root(container)).not.toHaveAttribute("defaultopen")
    expect(screen.queryByText("My spreadsheet")).not.toBeInTheDocument()
  })

  describe("docked", () => {
    it("keeps the work beside the conversation, with exactly one block root", () => {
      const { container } = render(<ChatAssistant messages={THREAD} variant="docked">{pageWork}</ChatAssistant>)
      expect(within(screen.getByRole("region", { name: "Your work" })).getByText("My spreadsheet")).toBeInTheDocument()
      expect(screen.getByText("Twelve are overdue.")).toBeInTheDocument()
      expect(container.querySelectorAll('[data-slot="chat-assistant"]')).toHaveLength(1)
      // The row sits one level below the container: a container query never sees the element it is written on.
      expect(root(container)).toHaveClass("@container")
      expect(root(container)).not.toHaveClass("@3xl:flex-row")
      expect(screen.getByRole("region", { name: "Your work" }).parentElement).toHaveClass("@3xl:flex-row")
    })

    it("shows a sample report when no work is passed", () => {
      render(<ChatAssistant messages={THREAD} variant="docked" />)
      expect(screen.getByRole("region", { name: "Your work" })).toHaveTextContent("March churn")
      expect(screen.getByRole("region", { name: "Your work" })).toHaveTextContent(/made up/)
    })

    it("closes to give the work its room, with focus on the way back", async () => {
      const onOpenChange = vi.fn()
      render(<ChatAssistant messages={THREAD} variant="docked" onOpenChange={onOpenChange}>{pageWork}</ChatAssistant>)
      await userEvent.click(screen.getByRole("button", { name: "Close Tally" }))
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      expect(screen.queryByRole("region", { name: "Chat with Tally" })).not.toBeInTheDocument()
      expect(screen.getByText("My spreadsheet")).toBeInTheDocument()
      const opener = screen.getByRole("button", { name: "Ask Tally" })
      await waitFor(() => expect(opener).toHaveFocus())
      await userEvent.click(opener)
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      await waitFor(() => expect(composer()).toHaveFocus())
    })

    it("keeps a half-written message while closed", async () => {
      render(<ChatAssistant messages={THREAD} variant="docked" />)
      await userEvent.type(composer(), "Draft a reminder")
      await userEvent.click(screen.getByRole("button", { name: "Close Tally" }))
      await userEvent.click(screen.getByRole("button", { name: "Ask Tally" }))
      expect(composer()).toHaveValue("Draft a reminder")
    })

    it("does not take focus from the page when it starts open", () => {
      render(<ChatAssistant messages={THREAD} variant="docked" />)
      expect(composer()).not.toHaveFocus()
    })

    it("still sends, shows errors and offers starter prompts", async () => {
      const onSend = vi.fn()
      const { rerender } = render(<ChatAssistant messages={[]} variant="docked" onSend={onSend} suggestions={["Show overdue invoices"]} />)
      await userEvent.click(screen.getByRole("button", { name: "Show overdue invoices" }))
      expect(onSend).toHaveBeenCalledExactlyOnceWith("Show overdue invoices")
      rerender(<ChatAssistant messages={THREAD} variant="docked" error="The model did not respond." />)
      expect(screen.getByRole("alert")).toHaveTextContent("The model did not respond.")
    })
  })

  describe("popup", () => {
    it("starts closed, with the page usable behind the launcher", () => {
      render(<ChatAssistant messages={THREAD} variant="popup">{pageWork}</ChatAssistant>)
      expect(screen.getByText("My spreadsheet")).toBeInTheDocument()
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expect(screen.queryByRole("textbox", { name: /message/i })).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Ask Tally" })).toHaveAttribute("aria-expanded", "false")
    })

    it("opens from the launcher and puts the cursor in the composer", async () => {
      const onOpenChange = vi.fn()
      render(<ChatAssistant messages={THREAD} variant="popup" onOpenChange={onOpenChange} />)
      await userEvent.click(screen.getByRole("button", { name: "Ask Tally" }))
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(screen.getByRole("dialog", { name: "Chat with Tally" })).toBeInTheDocument()
      await waitFor(() => expect(composer()).toHaveFocus())
      expect(screen.getByRole("button", { name: "Hide chat" })).toHaveAttribute("aria-expanded", "true")
    })

    it("closes on Escape and returns focus to the launcher", async () => {
      render(<ChatAssistant messages={THREAD} variant="popup" />)
      await userEvent.click(screen.getByRole("button", { name: "Ask Tally" }))
      await waitFor(() => expect(composer()).toHaveFocus())
      await userEvent.keyboard("{Escape}")
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole("button", { name: "Ask Tally" })).toHaveFocus())
    })

    it("does not close when Escape only cancels a syllable being composed", async () => {
      render(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
      fireEvent.keyDown(composer(), { key: "Escape", isComposing: true })
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("closes from the window's own button too", async () => {
      render(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
      await userEvent.click(screen.getByRole("button", { name: "Close chat" }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      await waitFor(() => expect(screen.getByRole("button", { name: "Ask Tally" })).toHaveFocus())
    })

    it("is positioned against the block, so a frame contains it", () => {
      const { container } = render(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
      expect(root(container)).toHaveClass("relative", "overflow-hidden")
      expect(screen.getByRole("dialog").className).not.toMatch(/\bfixed\b/)
      expect(screen.getByRole("button", { name: "Hide chat" }).className).not.toMatch(/\bfixed\b/)
    })

    it("keeps a half-written message while closed", async () => {
      render(<ChatAssistant messages={THREAD} variant="popup" defaultOpen />)
      await userEvent.type(composer(), "Draft a reminder")
      await userEvent.keyboard("{Escape}")
      await userEvent.click(screen.getByRole("button", { name: "Ask Tally" }))
      expect(composer()).toHaveValue("Draft a reminder")
    })

    it("says on the launcher when it is working, and when a reply arrived unseen", async () => {
      const { rerender } = render(<ChatAssistant messages={THREAD} status="generating" variant="popup" />)
      expect(screen.getByRole("button", { name: "Tally is working" })).toBeInTheDocument()
      rerender(<ChatAssistant messages={THREAD} status="idle" variant="popup" />)
      const launcher = screen.getByRole("button", { name: "New reply from Tally" })
      await userEvent.click(launcher)
      await userEvent.keyboard("{Escape}")
      expect(screen.getByRole("button", { name: "Ask Tally" })).toBeInTheDocument()
    })

    it("follows a controlled open prop", () => {
      const { rerender } = render(<ChatAssistant messages={THREAD} variant="popup" open={false} />)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      rerender(<ChatAssistant messages={THREAD} variant="popup" open />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("runs the sample inside the window when no messages are passed", async () => {
      vi.useFakeTimers()
      try {
        render(<ChatAssistant variant="popup" defaultOpen />)
        act(() => {
          vi.advanceTimersByTime(0)
        })
        expect(within(screen.getByRole("dialog")).getByText("Why did churn jump in March?")).toBeInTheDocument()
        expect(within(screen.getByRole("dialog")).getByRole("button", { name: "New chat" })).toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
