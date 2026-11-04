import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SettingsPage, type SettingsPageVariant } from "./settings-page"

// jsdom has no ResizeObserver, which Radix Switch and Select measure themselves with.
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const root = (container: HTMLElement) => container.querySelector('[data-slot="settings-page"]')
const nav = () => within(screen.getByRole("navigation", { name: "Settings sections" }))

describe("SettingsPage variants", () => {
  it("renders sections without the prop and for an unknown value", () => {
    const { container, rerender } = render(<SettingsPage />)
    expect(root(container)).toHaveAttribute("data-variant", "sections")
    const markup = container.innerHTML
    rerender(<SettingsPage variant={"nonsense" as SettingsPageVariant} />)
    expect(container.innerHTML).toBe(markup)
  })

  it("differs in structure, not only in colour", () => {
    const { unmount } = render(<SettingsPage variant="sections" />)
    expect(screen.getByLabelText("Display name")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Product news" })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "Settings sections" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save Profile" })).not.toBeInTheDocument()
    unmount()

    const sidebar = render(<SettingsPage variant="sidebar" />)
    expect(screen.getByLabelText("Display name")).toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: "Product news" })).not.toBeInTheDocument()
    sidebar.unmount()

    render(<SettingsPage variant="cards" />)
    expect(screen.getByRole("switch", { name: "Product news" })).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Settings sections" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save Profile" })).toBeInTheDocument()
  })

  describe("sidebar", () => {
    it("moves between sections, marking the one showing", async () => {
      render(<SettingsPage variant="sidebar" />)
      expect(nav().getByRole("button", { name: "Profile" })).toHaveAttribute("aria-current", "page")
      await userEvent.click(nav().getByRole("button", { name: "Notifications" }))
      expect(nav().getByRole("button", { name: "Notifications" })).toHaveAttribute("aria-current", "page")
      expect(nav().getByRole("button", { name: "Profile" })).not.toHaveAttribute("aria-current")
      expect(screen.getByRole("switch", { name: "Failed payments" })).toBeInTheDocument()
      expect(screen.queryByLabelText("Display name")).not.toBeInTheDocument()
    })

    it("keeps an edit made in a section that is no longer showing, and counts it in the nav", async () => {
      const onSave = vi.fn()
      render(<SettingsPage variant="sidebar" onSave={onSave} />)
      await userEvent.click(nav().getByRole("button", { name: "Notifications" }))
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      await userEvent.click(nav().getByRole("button", { name: "Plan" }))
      expect(nav().getByRole("button", { name: "Notifications, 1 unsaved" })).toBeInTheDocument()
      expect(screen.getByText("1 unsaved change")).toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
      expect(onSave.mock.calls[0][0]).toMatchObject({ "product-news": true })
      expect(onSave.mock.calls[0][1]).toEqual(["product-news"])
    })

    it("takes the person back to a problem in another section and focuses it", async () => {
      const onSave = vi.fn()
      render(<SettingsPage variant="sidebar" onSave={onSave} />)
      await userEvent.clear(screen.getByLabelText("Display name"))
      await userEvent.click(nav().getByRole("button", { name: "Notifications" }))
      expect(screen.queryByLabelText("Display name")).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
      expect(onSave).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveFocus())
      expect(nav().getByRole("button", { name: "Profile, 1 unsaved" })).toHaveAttribute("aria-current", "page")
      expect(screen.getByText(/Add a name/)).toBeInTheDocument()
    })

    it("discards edits across every section", async () => {
      render(<SettingsPage variant="sidebar" />)
      await userEvent.type(screen.getByLabelText("Display name"), "x")
      await userEvent.click(nav().getByRole("button", { name: "Notifications" }))
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      expect(screen.getByText("2 unsaved changes")).toBeInTheDocument()
      await userEvent.click(screen.getByRole("button", { name: "Discard" }))
      expect(screen.getByRole("switch", { name: "Product news" })).not.toBeChecked()
      await userEvent.click(nav().getByRole("button", { name: "Profile" }))
      expect(screen.getByLabelText("Display name")).toHaveValue("Mina Okafor")
    })

    it("keeps the danger section asking twice", async () => {
      render(<SettingsPage variant="sidebar" />)
      await userEvent.click(nav().getByRole("button", { name: "Delete workspace" }))
      const panel = within(screen.getByRole("region", { name: "Delete workspace" }))
      await userEvent.click(panel.getByRole("button", { name: "Delete workspace" }))
      expect(panel.getByRole("button", { name: "Keep workspace" })).toHaveFocus()
    })
  })

  describe("cards", () => {
    it("saves one group at a time, with only that group's values", async () => {
      const onSave = vi.fn()
      render(<SettingsPage variant="cards" onSave={onSave} />)
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      await userEvent.click(screen.getByRole("button", { name: "Save Profile" }))
      expect(onSave).not.toHaveBeenCalled()
      await userEvent.click(screen.getByRole("button", { name: "Save Notifications" }))
      expect(onSave).toHaveBeenCalledOnce()
      expect(onSave.mock.calls[0][1]).toEqual(["product-news"])
      expect(onSave.mock.calls[0][0]).not.toHaveProperty("name")
    })

    it("leaves the Save button in place and focused after saving", async () => {
      render(<SettingsPage variant="cards" />)
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      const save = screen.getByRole("button", { name: "Save Notifications" })
      expect(save).not.toHaveAttribute("aria-disabled")
      await userEvent.click(save)
      expect(await screen.findByText("Changes saved")).toBeInTheDocument()
      expect(save).toHaveFocus()
      expect(save).toHaveAttribute("aria-disabled", "true")
    })

    it("refuses invalid values and focuses the first problem in that group", async () => {
      const onSave = vi.fn()
      render(<SettingsPage variant="cards" onSave={onSave} />)
      const email = screen.getByLabelText("Email")
      await userEvent.clear(email)
      await userEvent.click(screen.getByRole("button", { name: "Save Profile" }))
      expect(onSave).not.toHaveBeenCalled()
      expect(screen.getByText("Fix 1 field to save")).toBeInTheDocument()
      await waitFor(() => expect(email).toHaveFocus())
    })

    it("keeps the edits and says so when saving fails", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("offline"))
      render(<SettingsPage variant="cards" onSave={onSave} />)
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      await userEvent.click(screen.getByRole("button", { name: "Save Notifications" }))
      expect(await screen.findByText(/Could not save/)).toBeInTheDocument()
      expect(screen.getByRole("switch", { name: "Product news" })).toBeChecked()
    })

    it("discards only the group it belongs to", async () => {
      render(<SettingsPage variant="cards" />)
      const name = screen.getByLabelText("Display name")
      await userEvent.type(name, "x")
      await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
      const notifications = within(screen.getByRole("region", { name: "Notifications" }))
      await userEvent.click(notifications.getByRole("button", { name: "Discard" }))
      expect(screen.getByRole("switch", { name: "Product news" })).not.toBeChecked()
      expect(name).toHaveValue("Mina Okaforx")
    })

    it("gives a group with nothing to save no Save button", () => {
      render(<SettingsPage variant="cards" />)
      expect(screen.queryByRole("button", { name: "Save Plan" })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Save Delete workspace" })).not.toBeInTheDocument()
    })
  })
})
