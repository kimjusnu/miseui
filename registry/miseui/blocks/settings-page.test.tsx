import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SettingsPage, type SettingsSection } from "./settings-page"

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

const saveButton = () => screen.queryByRole("button", { name: "Save changes" })

describe("SettingsPage", () => {
  it("shows profile, notifications, plan and the separated danger area with no props", () => {
    render(<SettingsPage />)
    expect(screen.getByLabelText("Display name")).toHaveValue("Mina Okafor")
    expect(screen.getByRole("switch", { name: "Failed payments" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Change plan" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Delete workspace" })).toHaveClass("border-t")
  })

  it("sets the page title in two tones inside one heading", () => {
    render(<SettingsPage title="Account." titleQuiet="Saved on request." />)
    expect(screen.getByRole("heading", { level: 2, name: "Account. Saved on request." })).toBeInTheDocument()
  })

  it("has no save bar until something changed", async () => {
    render(<SettingsPage />)
    expect(saveButton()).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
    expect(saveButton()).toBeInTheDocument()
    expect(screen.getByText("1 unsaved change")).toBeInTheDocument()
  })

  it("removes the bar again when an edit is typed back to the original", async () => {
    render(<SettingsPage />)
    const name = screen.getByLabelText("Display name")
    await userEvent.type(name, "x")
    expect(saveButton()).toBeInTheDocument()
    await userEvent.type(name, "{Backspace}")
    await waitFor(() => expect(saveButton()).not.toBeInTheDocument())
  })

  it("discard restores every value and hides the bar", async () => {
    render(<SettingsPage />)
    const name = screen.getByLabelText("Display name")
    await userEvent.clear(name)
    await userEvent.type(name, "Someone else")
    await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
    expect(screen.getByText("2 unsaved changes")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Discard" }))
    expect(name).toHaveValue("Mina Okafor")
    expect(screen.getByRole("switch", { name: "Product news" })).not.toBeChecked()
    await waitFor(() => expect(saveButton()).not.toBeInTheDocument())
  })

  it("flags an invalid field on blur, tied to the input for assistive tech", async () => {
    render(<SettingsPage />)
    const email = screen.getByLabelText("Email")
    await userEvent.clear(email)
    await userEvent.type(email, "mina")
    expect(screen.queryByText(/does not look like an email/)).not.toBeInTheDocument()
    await userEvent.tab()
    expect(email).toHaveAttribute("aria-invalid", "true")
    expect(email).toHaveAccessibleDescription(/does not look like an email/)
  })

  it("refuses to save invalid values and moves focus to the first problem", async () => {
    const onSave = vi.fn()
    render(<SettingsPage onSave={onSave} />)
    const name = screen.getByLabelText("Display name")
    await userEvent.clear(name)
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/Add a name/)).toBeInTheDocument()
    expect(screen.getByText("Fix 1 field to save")).toBeInTheDocument()
    await waitFor(() => expect(name).toHaveFocus())
  })

  it("saves the values and changed ids, then confirms and retires the bar", async () => {
    const onSave = vi.fn()
    render(<SettingsPage onSave={onSave} />)
    await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0][0]).toMatchObject({ "product-news": true, name: "Mina Okafor" })
    expect(onSave.mock.calls[0][1]).toEqual(["product-news"])
    expect(await screen.findByText("Changes saved")).toBeInTheDocument()
    expect(saveButton()).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText("Changes saved")).not.toBeInTheDocument(), { timeout: 4000 })
  })

  it("keeps the edits and says so when saving fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("offline"))
    render(<SettingsPage onSave={onSave} />)
    await userEvent.click(screen.getByRole("switch", { name: "Product news" }))
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(await screen.findByText(/Could not save/)).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Product news" })).toBeChecked()
    expect(saveButton()).toBeInTheDocument()
  })

  it("asks twice before a destructive action, focuses the safe choice, and offers undo", async () => {
    const onConfirm = vi.fn()
    const onUndo = vi.fn()
    const sections: SettingsSection[] = [
      {
        id: "danger",
        title: "Danger",
        tone: "danger",
        rows: [
          {
            kind: "danger",
            id: "delete",
            label: "Delete project",
            actionLabel: "Delete project",
            confirmLabel: "Yes, delete",
            cancelLabel: "Keep it",
            doneMessage: "Deleted.",
            onConfirm,
            onUndo,
          },
        ],
      },
    ]
    render(<SettingsPage sections={sections} />)
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus()
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.getByText("Deleted.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(screen.getByRole("button", { name: "Delete project" })).toBeInTheDocument()
  })

  it("marks the chosen section in the navigation", async () => {
    render(<SettingsPage />)
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }))
    expect(screen.getByRole("button", { name: "Notifications" })).toHaveAttribute("aria-current", "true")
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
