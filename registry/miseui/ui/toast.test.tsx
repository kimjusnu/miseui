import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Toaster, deckPlacement, resolveSwipe, toast, toastStore, type ToastVariant } from "./toast"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  act(() => toast.dismiss())
  vi.useRealTimers()
})

window.scrollTo = vi.fn()

const send = (fn: () => unknown) => act(() => void fn())
const count = () => toastStore.getSnapshot().length
const cards = () => [...document.querySelectorAll("[data-slot='toast']")] as HTMLElement[]

describe("toast store", () => {
  it("replaces the array and never mutates an old snapshot", () => {
    const before = toastStore.getSnapshot()
    const id = toast("Draft saved")
    const after = toastStore.getSnapshot()
    expect(after).not.toBe(before)
    expect(before).toHaveLength(0)
    toast("Report sent")
    expect(after).toHaveLength(1)
    expect(toastStore.getSnapshot().map((record) => record.title)).toEqual(["Report sent", "Draft saved"])
    toast.success("Draft published", { id })
    expect(toastStore.getSnapshot().find((record) => record.id === id)?.title).toBe("Draft published")
    expect(toastStore.getSnapshot()).toHaveLength(2)
    toast.dismiss()
  })

  it("gives each type a sensible duration, and more time when there is a button", () => {
    toast("Saved", { id: "a" })
    toast.error("Failed", { id: "b" })
    toast.loading("Sending", { id: "c" })
    toast("Archived", { id: "d", action: { label: "Undo", onClick: () => {} } })
    const durations = Object.fromEntries(toastStore.getSnapshot().map((record) => [record.id, record.duration]))
    expect(durations.b).toBeGreaterThan(durations.a)
    expect(durations.c).toBe(Number.POSITIVE_INFINITY)
    expect(durations.d).toBeGreaterThanOrEqual(8000)
    toast.dismiss()
  })
})

describe("toast.promise", () => {
  it("goes from loading to success", async () => {
    render(<Toaster />)
    let finish: (value: string) => void = () => {}
    const work = new Promise<string>((resolve) => {
      finish = resolve
    })
    send(() => toast.promise(work, { loading: "Uploading", success: (name) => `${name} uploaded`, error: "Failed" }))
    expect(screen.getByRole("status")).toHaveTextContent("Uploading")
    expect(toastStore.getSnapshot()[0].type).toBe("loading")
    await act(async () => finish("report.pdf"))
    expect(screen.getByRole("status")).toHaveTextContent("report.pdf uploaded")
    expect(toastStore.getSnapshot()[0].type).toBe("success")
    expect(count()).toBe(1)
  })

  it("goes from loading to error and hands the rejection back to the caller", async () => {
    render(<Toaster />)
    const work = Promise.reject(new Error("offline"))
    let returned: Promise<unknown> = Promise.resolve()
    await act(async () => {
      returned = toast.promise(work, { loading: "Saving", success: "Saved", error: (reason) => (reason as Error).message })
      await returned.catch(() => {})
    })
    await expect(returned).rejects.toThrow("offline")
    expect(screen.getByRole("alert")).toHaveTextContent("offline")
  })
})

describe("Toaster timing", () => {
  it("dismisses after its duration", () => {
    vi.useFakeTimers()
    render(<Toaster />)
    send(() => toast("Draft saved", { duration: 1000 }))
    act(() => vi.advanceTimersByTime(999))
    expect(count()).toBe(1)
    act(() => vi.advanceTimersByTime(1))
    expect(count()).toBe(0)
  })

  it("pauses on hover and resumes with the time that was left", () => {
    vi.useFakeTimers()
    render(<Toaster />)
    send(() => toast("Draft saved", { duration: 1000 }))
    act(() => vi.advanceTimersByTime(600))
    fireEvent.pointerEnter(screen.getByRole("region", { name: "Notifications" }))
    act(() => vi.advanceTimersByTime(5000))
    expect(count()).toBe(1)
    fireEvent.pointerLeave(screen.getByRole("region", { name: "Notifications" }))
    act(() => vi.advanceTimersByTime(399))
    expect(count()).toBe(1)
    act(() => vi.advanceTimersByTime(1))
    expect(count()).toBe(0)
  })

  it("keeps loading toasts until their work settles", () => {
    vi.useFakeTimers()
    render(<Toaster />)
    send(() => toast.loading("Sending"))
    act(() => vi.advanceTimersByTime(60_000))
    expect(count()).toBe(1)
  })
})

describe("Toaster interaction", () => {
  it("runs the action once and removes the toast", async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<Toaster />)
    send(() => toast("Invoice archived", { action: { label: "Undo", onClick: onUndo } }))
    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(count()).toBe(0)
  })

  it("dismisses from the button and from Escape when focused", async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    send(() => toast("Draft saved"))
    await user.click(screen.getByRole("button", { name: "Dismiss: Draft saved" }))
    expect(count()).toBe(0)
    send(() => toast("Report sent"))
    await waitFor(() => expect(screen.getByRole("button", { name: "Dismiss: Report sent" })).toBeInTheDocument())
    await user.tab()
    expect(screen.getByRole("button", { name: "Dismiss: Report sent" })).toHaveFocus()
    await user.keyboard("{Escape}")
    expect(count()).toBe(0)
  })

  it("only shows toasts sent to its own id", () => {
    render(
      <>
        <Toaster id="one" aria-label="One" />
        <Toaster id="two" aria-label="Two" />
      </>,
    )
    send(() => toast("For one", { toaster: "one" }))
    expect(screen.getByRole("region", { name: "One" })).toHaveTextContent("For one")
    expect(screen.getByRole("region", { name: "Two" })).not.toHaveTextContent("For one")
  })
})

describe("Toaster live regions", () => {
  it("announces through regions that exist before the toast does", () => {
    render(<Toaster />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toBeEmptyDOMElement()
    send(() => toast.success("Draft saved"))
    expect(status).toHaveTextContent("Draft saved")
    send(() => toast.error("Payment failed"))
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive")
    expect(screen.getByRole("alert")).toHaveTextContent("Payment failed")
  })
})

describe("Toaster variants", () => {
  const region = () => screen.getByRole("region", { name: "Notifications" })

  it.each<ToastVariant>(["stack", "list", "pill", "bar"])("%s marks the root", (variant) => {
    render(<Toaster variant={variant} />)
    expect(region()).toHaveAttribute("data-variant", variant)
  })

  it("stack lays cards out as an absolute deck that fans out on hover", () => {
    render(<Toaster variant="stack" />)
    send(() => {
      toast("Oldest")
      toast("Newest")
    })
    const [front, back] = cards()
    expect(front).toHaveTextContent("Newest")
    expect(front).toHaveClass("absolute")
    expect(region()).toHaveAttribute("data-expanded", "false")
    expect(back.querySelector("[inert]")).not.toBeNull()
    expect(front.querySelector("[inert]")).toBeNull()
    fireEvent.pointerEnter(region())
    expect(region()).toHaveAttribute("data-expanded", "true")
    expect(back.querySelector("[inert]")).toBeNull()
  })

  it("list keeps cards in normal flow, newest at the edge", () => {
    render(<Toaster variant="list" />)
    send(() => {
      toast("Oldest")
      toast("Newest")
    })
    const [front] = cards()
    expect(front).not.toHaveClass("absolute")
    expect(front.parentElement).toHaveClass("flex-col-reverse")
    expect(cards()).toHaveLength(2)
  })

  it("pill is one centred capsule that holds back the description", () => {
    render(<Toaster variant="pill" />)
    send(() => {
      toast("Earlier")
      toast("Copied", { description: "The link is on your clipboard" })
    })
    expect(cards()).toHaveLength(1)
    expect(cards()[0]).toHaveClass("rounded-full")
    expect(region()).toHaveClass("left-1/2")
    expect(screen.queryByText("The link is on your clipboard")).toBeNull()
  })

  it("bar spans the edge and takes its tone from the type", () => {
    render(<Toaster variant="bar" position="top-center" />)
    send(() => toast.error("Connection lost"))
    expect(region()).toHaveClass("inset-x-0", "top-0")
    expect(cards()[0]).toHaveClass("bg-destructive")
  })

  it("contained stays inside its parent instead of the viewport", () => {
    render(<Toaster contained />)
    expect(region()).toHaveClass("absolute")
    expect(region()).not.toHaveClass("fixed")
  })
})

describe("deckPlacement", () => {
  const heights = [60, 100, 80]

  it("peeks at rest and hides the back cards", () => {
    const back = deckPlacement({ index: 1, expanded: false, heights, direction: -1 })
    expect(back.y).toBe(-8)
    expect(back.scale).toBeLessThan(1)
    expect(back.height).toBe(60)
    expect(back.hideContent).toBe(true)
    expect(deckPlacement({ index: 0, expanded: false, heights, direction: -1 }).hideContent).toBe(false)
  })

  it("stacks real heights when fanned out, in the toaster direction", () => {
    expect(deckPlacement({ index: 2, expanded: true, heights, direction: -1 }).y).toBe(-(60 + 8 + 100 + 8))
    expect(deckPlacement({ index: 1, expanded: true, heights, direction: 1 }).y).toBe(68)
    expect(deckPlacement({ index: 1, expanded: true, heights, direction: 1 }).scale).toBe(1)
  })
})

describe("resolveSwipe", () => {
  it("settles back from a small, slow drag", () => {
    expect(resolveSwipe({ offset: 40, velocity: 0, width: 300 })).toBe(0)
  })

  it("goes when dragged past half its width", () => {
    expect(resolveSwipe({ offset: 200, velocity: 0, width: 300 })).toBe(1)
    expect(resolveSwipe({ offset: -200, velocity: 0, width: 300 })).toBe(-1)
  })

  it("counts momentum, so a short flick is enough", () => {
    expect(resolveSwipe({ offset: 40, velocity: 1000, width: 300 })).toBe(1)
  })

  it("lets a throw back cancel a long drag", () => {
    expect(resolveSwipe({ offset: 200, velocity: -600, width: 300 })).toBe(0)
  })
})

describe("Toaster spring effect", () => {
  it("marks the root and still dismisses with the keyboard", async () => {
    const user = userEvent.setup()
    render(<Toaster effect="spring" variant="list" />)
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("data-effect", "spring")
    send(() => toast("Draft saved"))
    await user.tab()
    await user.keyboard("{Escape}")
    expect(count()).toBe(0)
  })
})
