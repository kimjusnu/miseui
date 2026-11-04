import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SiteFooter, type SiteFooterVariant } from "./site-footer"
import { looksLikeEmail } from "./site-footer-signup"

/** Tags and classes, not ids: useId differs between two renders of the same markup. */
function shape(root: Element) {
  return Array.from(root.querySelectorAll("*")).map((node) => `${node.tagName} ${node.getAttribute("class") ?? ""}`)
}

const root = (container: HTMLElement) => container.querySelector('[data-slot="site-footer"]') as HTMLElement

describe("SiteFooter", () => {
  it("renders columns with no prop, and for a name it does not know", () => {
    const { container: plain } = render(<SiteFooter />)
    expect(root(plain)).toHaveAttribute("data-variant", "columns")
    for (const unknown of ["nope", "constructor"]) {
      const { container } = render(<SiteFooter variant={unknown as SiteFooterVariant} />)
      expect(root(container)).toHaveAttribute("data-variant", "columns")
      expect(shape(root(container))).toEqual(shape(root(plain)))
    }
  })

  it("differs in structure between variants, not only in colour", () => {
    const seen = (["columns", "minimal", "signup"] as const).map((variant) => {
      const { container } = render(<SiteFooter variant={variant} />)
      return shape(root(container)).join("|")
    })
    expect(new Set(seen).size).toBe(3)
  })

  it("is a footer landmark, and keeps variant props off the DOM node", () => {
    const { container } = render(<SiteFooter variant="minimal" tagline="x" onSubscribe={() => undefined} aria-label="Site" />)
    expect(screen.getByRole("contentinfo", { name: "Site" })).toBe(root(container))
    expect(root(container)).not.toHaveAttribute("tagline")
    expect(root(container)).not.toHaveAttribute("onSubscribe")
  })

  it("gives every text link a 40 px press area on touch, on all three", () => {
    for (const variant of ["columns", "minimal", "signup"] as const) {
      const { container, unmount } = render(<SiteFooter variant={variant} />)
      const links = Array.from(container.querySelectorAll("a"))
      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        expect(link.className).toContain("pointer-coarse:after:-inset-y-2.5")
        expect(link.className).toContain("leading-5")
      }
      unmount()
    }
  })

  describe("columns", () => {
    it("names each group of the links the owner passes, and builds the copyright from the brand", () => {
      render(<SiteFooter brand="Ledgerly" columns={[{ title: "Help", links: [{ label: "Docs", href: "/docs" }] }]} legal={[{ label: "Privacy", href: "/privacy" }]} />)
      const group = screen.getByRole("list", { name: "Help" })
      expect(within(group).getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs")
      expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Ledgerly`))).toBeInTheDocument()
    })

    it("leaves only the legal line when there are no columns", () => {
      render(<SiteFooter columns={[]} />)
      expect(screen.queryByRole("navigation", { name: "Footer" })).not.toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument()
    })
  })

  describe("minimal", () => {
    it("is one row of links and a copyright, with no groups and no field", () => {
      render(<SiteFooter variant="minimal" copyright="Made in Busan" links={[{ label: "Help", href: "/help" }]} />)
      expect(screen.getByText("Made in Busan")).toBeInTheDocument()
      expect(screen.getAllByRole("link")).toHaveLength(1)
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    })
  })

  describe("signup", () => {
    it("refuses a mistyped address, says why, and keeps focus in the field", async () => {
      const onSubscribe = vi.fn()
      render(<SiteFooter variant="signup" onSubscribe={onSubscribe} />)
      const field = screen.getByRole("textbox", { name: "Email address" })
      await userEvent.type(field, "maya@northgate{Enter}")
      expect(onSubscribe).not.toHaveBeenCalled()
      expect(screen.getByRole("alert")).toHaveTextContent(/enter an email address/i)
      expect(field).toHaveAttribute("aria-invalid", "true")
      expect(field).toHaveFocus()
      await userEvent.type(field, ".studio")
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(field).not.toHaveAttribute("aria-invalid")
    })

    it("reaches a done state that takes focus and names the address", async () => {
      const onSubscribe = vi.fn()
      render(<SiteFooter variant="signup" onSubscribe={onSubscribe} />)
      await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "  maya@northgate.studio ")
      await userEvent.click(screen.getByRole("button", { name: "Subscribe" }))
      expect(onSubscribe).toHaveBeenCalledExactlyOnceWith("maya@northgate.studio")
      const done = await screen.findByRole("status")
      expect(done).toHaveTextContent("maya@northgate.studio")
      await waitFor(() => expect(done).toHaveFocus())
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    })

    it("cannot be sent twice while it is sending", async () => {
      let finish = () => {}
      const onSubscribe = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
      render(<SiteFooter variant="signup" onSubscribe={onSubscribe} />)
      await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "maya@northgate.studio{Enter}")
      const sending = screen.getByRole("button", { name: "Subscribing" })
      expect(sending).toHaveAttribute("aria-disabled", "true")
      await userEvent.click(sending)
      expect(onSubscribe).toHaveBeenCalledOnce()
      finish()
      expect(await screen.findByRole("status")).toBeInTheDocument()
    })

    it("keeps the address and offers another try when saving fails", async () => {
      const onSubscribe = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValueOnce(undefined)
      render(<SiteFooter variant="signup" onSubscribe={onSubscribe} />)
      const field = screen.getByRole("textbox", { name: "Email address" })
      await userEvent.type(field, "maya@northgate.studio{Enter}")
      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(/did not go through/)
      expect(alert).not.toHaveTextContent("Failed to fetch")
      expect(field).toHaveValue("maya@northgate.studio")
      await userEvent.click(screen.getByRole("button", { name: "Subscribe" }))
      expect(await screen.findByRole("status")).toBeInTheDocument()
    })

    it("reaches done in the preview with no handler at all", async () => {
      render(<SiteFooter variant="signup" />)
      await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "maya@northgate.studio{Enter}")
      expect(await screen.findByRole("status", {}, { timeout: 2000 })).toHaveTextContent("You are on the list")
    })

    it("tells a typo from a plausible address", () => {
      expect(looksLikeEmail("a@b.co")).toBe(true)
      for (const typo of ["", "a@b", "a b@c.co", "@b.co", "a@.", "a@b."]) expect(looksLikeEmail(typo)).toBe(false)
    })
  })
})
