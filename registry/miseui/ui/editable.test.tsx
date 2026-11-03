import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { Editable, type EditableProps, type EditableVariant } from "./editable"

const setup = () => userEvent.setup()
const read = () => screen.getByRole("button", { name: /^Edit Title/ })
const field = () => screen.getByRole("textbox", { name: "Title" })

const renderEditable = (props: Partial<EditableProps> = {}) =>
  render(
    <>
      <Editable label="Title" defaultValue="Spring launch" {...props} />
      <button type="button">Outside</button>
    </>,
  )

describe("Editable", () => {
  it("names the read view with the current value and enters editing on click, text selected", async () => {
    const user = setup()
    const onEditingChange = vi.fn()
    renderEditable({ onEditingChange })
    expect(read()).toHaveAccessibleName("Edit Title: Spring launch")
    await user.click(read())
    expect(field()).toHaveFocus()
    expect(field()).toHaveValue("Spring launch")
    expect((field() as HTMLInputElement).selectionStart).toBe(0)
    expect((field() as HTMLInputElement).selectionEnd).toBe("Spring launch".length)
    expect(onEditingChange).toHaveBeenCalledWith(true)
  })

  it("commits on Enter, returns focus to the read view and reports the value once", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ onValueChange })
    await user.click(read())
    await user.clear(field())
    await user.keyboard("Autumn launch{Enter}")
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("Autumn launch")
    expect(read()).toHaveAccessibleName("Edit Title: Autumn launch")
    expect(read()).toHaveFocus()
  })

  it("reverts on Escape without firing a change and keeps Escape from reaching a dialog", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    const onOuterKey = vi.fn()
    render(
      <div onKeyDown={onOuterKey}>
        <Editable label="Title" defaultValue="Spring launch" onValueChange={onValueChange} />
      </div>,
    )
    await user.click(read())
    await user.keyboard("Something else{Escape}")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(read()).toHaveAccessibleName("Edit Title: Spring launch")
    expect(read()).toHaveFocus()
    expect(onOuterKey.mock.calls.some(([event]) => event.key === "Escape")).toBe(false)
  })

  it("commits on blur by default, without stealing the focus back", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ onValueChange })
    await user.click(read())
    await user.keyboard("Summer launch")
    await user.click(screen.getByRole("button", { name: "Outside" }))
    expect(onValueChange).toHaveBeenCalledWith("Summer launch")
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus()
  })

  it("reverts on blur when told to", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ onValueChange, blurAction: "revert" })
    await user.click(read())
    await user.keyboard("Summer launch")
    await user.click(screen.getByRole("button", { name: "Outside" }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(read()).toHaveAccessibleName("Edit Title: Spring launch")
  })

  it("refuses an invalid value, keeps what was typed and links the message", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ onValueChange, validate: (value) => (value.trim() ? undefined : "A title is required.") })
    await user.click(read())
    await user.clear(field())
    await user.keyboard("{Enter}")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(field()).toHaveAttribute("aria-invalid", "true")
    expect(field()).toHaveAccessibleDescription("A title is required.")
    expect(screen.getByRole("alert")).toHaveTextContent("A title is required.")
    await user.keyboard("A")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("A")
  })

  it("does not take the Enter that confirms an IME syllable as a commit", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ onValueChange })
    await user.click(read())
    fireEvent.keyDown(field(), { key: "Enter", isComposing: true })
    expect(field()).toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("keeps Enter for new lines in an area and commits on Mod+Enter", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ variant: "area", onValueChange, selectOnEdit: false })
    await user.click(read())
    await user.keyboard("{Enter}second line")
    expect(field()).toHaveValue("Spring launch\nsecond line")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard("{Control>}{Enter}{/Control}")
    expect(onValueChange).toHaveBeenCalledWith("Spring launch\nsecond line")
  })

  it("flattens a pasted line break in a single-line value", async () => {
    const user = setup()
    renderEditable({ variant: "heading" })
    await user.click(read())
    fireEvent.change(field(), { target: { value: "One\nTwo" } })
    expect(field()).toHaveValue("One Two")
  })

  it("does not treat moving to its own buttons as leaving, and cancel really cancels", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ variant: "area", onValueChange })
    await user.click(read())
    await user.keyboard("Changed")
    await user.tab()
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    expect(field()).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(read()).toHaveAccessibleName("Edit Title: Spring launch")
  })

  it("saves through its button", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    renderEditable({ variant: "field", onValueChange, effect: "materialize" })
    await user.click(read())
    await user.keyboard("Saved")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onValueChange).toHaveBeenCalledWith("Saved")
  })

  it("makes the variants differ in structure", async () => {
    const user = setup()
    const shape = async (variant: EditableVariant) => {
      const { unmount } = renderEditable({ variant })
      const pencil = read().querySelector("svg") !== null
      const readClass = read().className
      await user.click(read())
      const result = {
        tag: field().tagName,
        actions: document.querySelector("[data-slot='editable-actions']") !== null,
        pencil,
        big: readClass.includes("text-2xl"),
      }
      unmount()
      return result
    }
    expect(await shape("text")).toEqual({ tag: "INPUT", actions: false, pencil: false, big: false })
    expect(await shape("heading")).toEqual({ tag: "TEXTAREA", actions: false, pencil: false, big: true })
    expect(await shape("area")).toEqual({ tag: "TEXTAREA", actions: true, pencil: false, big: false })
    expect(await shape("field")).toEqual({ tag: "INPUT", actions: true, pencil: true, big: false })
  })

  it("keeps read and edit on one box model so the layout does not move", async () => {
    const user = setup()
    renderEditable({ variant: "text" })
    const readClasses = read().className.split(" ")
    await user.click(read())
    const fieldClasses = field().className.split(" ")
    for (const name of ["px-2", "py-1", "text-sm", "leading-6", "border", "rounded-md"]) {
      expect(readClasses).toContain(name)
      expect(fieldClasses).toContain(name)
    }
  })

  it("does nothing when disabled, and shows the placeholder when empty", () => {
    render(<Editable label="Title" defaultValue="" disabled placeholder="Untitled" />)
    expect(read()).toBeDisabled()
    expect(read()).toHaveTextContent("Untitled")
  })

  it("follows a controlled value", async () => {
    const user = setup()
    const Controlled = () => {
      const [value, setValue] = useState("One")
      return (
        <>
          <Editable label="Title" value={value} onValueChange={(next) => setValue(next.toUpperCase())} />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    await user.click(read())
    await user.keyboard("two{Enter}")
    expect(screen.getByRole("status")).toHaveTextContent("TWO")
    expect(read()).toHaveAccessibleName("Edit Title: TWO")
  })
})
