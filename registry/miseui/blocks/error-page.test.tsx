import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ErrorPage, type ErrorPageCode, type ErrorPageVariant } from "./error-page"
import { resolveErrorCode } from "./error-page-copy"

const root = (container: HTMLElement) => container.querySelector('[data-slot="error-page"]')

describe("error-page helpers", () => {
  it("resolves codes, and never reaches into the object prototype", () => {
    expect(resolveErrorCode("offline")).toBe("offline")
    expect(resolveErrorCode(404)).toBe("404")
    expect(resolveErrorCode(500)).toBe("500")
    expect(resolveErrorCode(503)).toBe("500")
    expect(resolveErrorCode("constructor")).toBe("404")
    expect(resolveErrorCode(undefined)).toBe("404")
  })
})

describe("ErrorPage variants", () => {
  it("renders centered without the prop and for an unknown value, including constructor", () => {
    const { container, rerender } = render(<ErrorPage />)
    expect(root(container)).toHaveAttribute("data-variant", "centered")
    rerender(<ErrorPage variant={"constructor" as ErrorPageVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "centered")
    rerender(<ErrorPage variant={"nonsense" as ErrorPageVariant} />)
    expect(root(container)).toHaveAttribute("data-variant", "centered")
  })

  it("differs in structure, not only in colour", () => {
    const { container, rerender } = render(<ErrorPage />)
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    expect(screen.queryByTestId("error-readout")).not.toBeInTheDocument()
    rerender(<ErrorPage variant="split" />)
    expect(root(container)).toHaveAttribute("data-variant", "split")
    expect(screen.getByRole("list")).toBeInTheDocument()
    rerender(<ErrorPage variant="terminal" />)
    expect(root(container)).toHaveAttribute("data-variant", "terminal")
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    expect(screen.getByTestId("error-readout")).toBeInTheDocument()
  })

  it("does not put its props on the DOM node", () => {
    const { container } = render(<ErrorPage code="500" homeHref="/app" reference="req_1" />)
    expect(root(container)).not.toHaveAttribute("code")
    expect(root(container)).not.toHaveAttribute("homeHref")
    expect(root(container)).not.toHaveAttribute("reference")
  })

  it("does not crash on a code that is not real", () => {
    render(<ErrorPage code={"constructor" as ErrorPageCode} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We could not find this page.")
  })
})

describe("the code prop", () => {
  it("404 says it could not find the page, blames nobody, and goes home or back", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined)
    render(<ErrorPage code={404} homeHref="/app" />)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("We could not find this page.")
    expect(heading.textContent).not.toMatch(/you (typed|entered|mistyped)|your fault|oops/i)
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/app")
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Go back" }))
    expect(back).toHaveBeenCalledOnce()
    back.mockRestore()
  })

  it("500 owns the problem and offers a retry first", () => {
    render(<ErrorPage code="500" />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Something went wrong on our side.")
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute("data-variant", "mise")
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("data-variant", "outline")
    expect(screen.getByRole("link", { name: "Contact support" })).toBeInTheDocument()
  })

  it("offline offers no link that needs the network", () => {
    render(<ErrorPage code="offline" />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This page needs a connection.")
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument()
  })

  it("offline follows what the device reports", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false)
    render(<ErrorPage code="offline" />)
    expect(screen.getByRole("status")).toHaveTextContent("no connection yet")
    online.mockReturnValue(true)
    act(() => {
      window.dispatchEvent(new Event("online"))
    })
    expect(screen.getByRole("status")).toHaveTextContent("reports a connection now")
    online.mockRestore()
  })

  it("lets the owner replace the words and remove the support link", () => {
    render(<ErrorPage code="500" title="Billing is down." detail="Invoices still send." helpHref={null} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Billing is down. Invoices still send.")
    expect(screen.queryByRole("link", { name: "Contact support" })).not.toBeInTheDocument()
  })
})

describe("retry", () => {
  it("waits, then says plainly when it did not work", async () => {
    let fail = () => {}
    const onRetry = vi.fn(() => new Promise<void>((_, reject) => { fail = () => reject(new Error("still down")) }))
    render(<ErrorPage code="500" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    const waiting = screen.getByRole("button", { name: "Trying again" })
    expect(waiting).toHaveAttribute("aria-busy", "true")
    await userEvent.click(waiting)
    expect(onRetry).toHaveBeenCalledOnce()
    await act(async () => fail())
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("That did not work either."))
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})

describe("split", () => {
  it("lists places that work for 404, and things to read for offline", () => {
    const { rerender } = render(<ErrorPage variant="split" code="404" />)
    const places = within(screen.getByRole("list"))
    expect(places.getByRole("link", { name: /Invoices/ })).toHaveAttribute("href", "#invoices")
    rerender(<ErrorPage variant="split" code="offline" />)
    expect(screen.getByText("Airplane mode is off")).toBeInTheDocument()
    expect(within(screen.getByRole("list")).queryByRole("link")).not.toBeInTheDocument()
  })

  it("takes the owner's places", () => {
    render(<ErrorPage variant="split" links={[{ label: "Your dashboard", href: "/dashboard" }]} />)
    expect(screen.getByRole("link", { name: "Your dashboard" })).toHaveAttribute("href", "/dashboard")
    expect(screen.queryByRole("link", { name: /Invoices/ })).not.toBeInTheDocument()
  })
})

describe("terminal", () => {
  it("is a plain readout of real values, with no prompt to type at", () => {
    render(<ErrorPage variant="terminal" code="500" path="/invoices/8841" reference="req_example" />)
    const readout = screen.getByTestId("error-readout")
    expect(readout).toHaveTextContent("status500")
    expect(readout).toHaveTextContent("path/invoices/8841")
    expect(readout).toHaveTextContent("referencereq_example")
    expect(readout.textContent).not.toMatch(/\$ |>_|sudo|curl/)
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("leaves out rows it has nothing for, and reads the real address", () => {
    render(<ErrorPage variant="terminal" />)
    const readout = screen.getByTestId("error-readout")
    expect(readout).not.toHaveTextContent("reference")
    expect(readout).not.toHaveTextContent("time")
    expect(readout).toHaveTextContent(`path${window.location.pathname}`)
  })

  it("keeps the same way out as the other designs", () => {
    render(<ErrorPage variant="terminal" code="500" />)
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copy these details" })).toBeInTheDocument()
  })
})

describe("reference", () => {
  it("shows beside the message with a copy button", () => {
    render(<ErrorPage code="500" reference="req_example" />)
    expect(screen.getByText("req_example")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copy reference" })).toBeInTheDocument()
  })
})
