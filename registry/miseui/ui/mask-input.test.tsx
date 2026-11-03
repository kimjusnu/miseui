import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { MaskInput, type MaskInputVariant } from "./mask-input"
import { applyEdit, caretForRaw, diffEdit, rawIndexAt } from "./mask-input-edit"
import {
  activeGroupIndex,
  capacity,
  conform,
  formatMasked,
  isComplete,
  isNumericMask,
  maskGroups,
  parseFormatted,
  parseMask,
  placeholderFor,
} from "./mask-input-math"

const PHONE = parseMask("(###) ###-####")
const DATE = parseMask("##/##/####")

describe("mask engine", () => {
  it("parses tokens, literals and escapes", () => {
    const slots = parseMask("A\\A-#")
    expect(slots.map((slot) => slot.kind)).toEqual(["token", "literal", "literal", "token"])
    expect(capacity(slots)).toBe(2)
    expect(isNumericMask(PHONE)).toBe(true)
    expect(isNumericMask(parseMask("A#"))).toBe(false)
    expect(placeholderFor(DATE)).toBe("__/__/____")
  })

  it("custom tokens replace or extend the defaults", () => {
    const hex = parseMask("xx", { x: { test: (character) => /^[0-9a-f]$/i.test(character), transform: (character) => character.toUpperCase() } })
    expect(conform("zaf", hex)).toBe("AF")
  })

  it("shows literals only up to the last typed character", () => {
    expect(formatMasked("", PHONE)).toBe("")
    expect(formatMasked("5", PHONE)).toBe("(5")
    expect(formatMasked("555", PHONE)).toBe("(555")
    expect(formatMasked("5551", PHONE)).toBe("(555) 1")
    expect(formatMasked("5551234567", PHONE)).toBe("(555) 123-4567")
  })

  it("conforms characters to their slots and transforms them", () => {
    expect(conform("ab12cd", parseMask("AA-##"))).toBe("AB12")
    expect(conform("12345678901", PHONE)).toBe("1234567890")
    expect(isComplete("1234567890", PHONE)).toBe(true)
    expect(isComplete("123", PHONE)).toBe(false)
  })

  it("reads text already in the mask's shape, so literal digits never leak into the raw value", () => {
    const code = parseMask("+82 ## ####")
    expect(parseFormatted("+82 10 1234", code)).toBe("101234")
    expect(parseFormatted("101234", code)).toBeNull()
    expect(parseFormatted("(555) 123", PHONE)).toBe("555123")
    expect(parseFormatted("555", PHONE)).toBeNull()
  })

  it("translates between caret and raw position", () => {
    expect(rawIndexAt(0, PHONE)).toBe(0)
    expect(rawIndexAt(1, PHONE)).toBe(0)
    expect(rawIndexAt(4, PHONE)).toBe(3)
    expect(rawIndexAt(6, PHONE)).toBe(3)
    expect(rawIndexAt(7, PHONE)).toBe(4)
    expect(caretForRaw(3, PHONE, 9, false)).toBe(4)
    expect(caretForRaw(3, PHONE, 9, true)).toBe(6)
    expect(caretForRaw(0, PHONE, 9, false)).toBe(1)
    expect(caretForRaw(3, PHONE, 4, true)).toBe(4)
  })

  it("works out an edit from the text and caret after it", () => {
    expect(diffEdit("12/34", "129/34", 3)).toEqual({ start: 2, end: 2, inserted: "9" })
    expect(diffEdit("12/34", "1234", 2)).toEqual({ start: 2, end: 3, inserted: "" })
    expect(diffEdit("12/34", "1/34", 1)).toEqual({ start: 1, end: 2, inserted: "" })
    expect(diffEdit("12/34", "89", 2)).toEqual({ start: 0, end: 5, inserted: "89" })
  })

  it("types into the middle and pushes the rest along", () => {
    expect(applyEdit("1234", DATE, "19/2/34".replace("/2/", "2/"), 2)).toMatchObject({ raw: "19234" })
    const result = applyEdit("1234", DATE, "192/34", 2)
    expect(result).toEqual({ raw: "19234", masked: "19/23/4", caret: 3 })
  })

  it("steps past a literal after typing the character before it", () => {
    expect(applyEdit("12", DATE, "123", 3)).toEqual({ raw: "123", masked: "12/3", caret: 4 })
    expect(applyEdit("1", DATE, "12", 2)).toEqual({ raw: "12", masked: "12", caret: 2 })
  })

  it("rejects a key that does not fit and leaves the caret where it was", () => {
    expect(applyEdit("12", DATE, "1x2", 2)).toEqual({ raw: "12", masked: "12", caret: 1 })
    expect(applyEdit("12", DATE, "12x", 3)).toEqual({ raw: "12", masked: "12", caret: 2 })
  })

  it("refuses new characters when full instead of silently dropping the last one", () => {
    const full = "12345678"
    const result = applyEdit(full, DATE, "192/34/5678", 2)
    expect(result.raw).toBe(full)
    expect(result.masked).toBe("12/34/5678")
  })

  it("Backspace across a literal removes the character before it", () => {
    expect(applyEdit("1234", DATE, "1234", 2, "deleteContentBackward")).toEqual({ raw: "134", masked: "13/4", caret: 1 })
  })

  it("Delete across a literal removes the character after it", () => {
    expect(applyEdit("1234", DATE, "1234", 2, "deleteContentForward")).toEqual({ raw: "124", masked: "12/4", caret: 2 })
  })

  it("deletes a selection spanning literals", () => {
    expect(applyEdit("123456", DATE, "16", 1)).toEqual({ raw: "16", masked: "16", caret: 1 })
    expect(applyEdit("1234", DATE, "", 0)).toEqual({ raw: "", masked: "", caret: 0 })
  })

  it("pastes with separators, and a formatted paste keeps literal digits out", () => {
    expect(applyEdit("", PHONE, "555-123-4567", 12).masked).toBe("(555) 123-4567")
    const code = parseMask("+82 ## ####")
    expect(applyEdit("", code, "+82 10 1234", 11).raw).toBe("101234")
  })

  it("splits groups between literals", () => {
    expect(maskGroups("12345", parseMask("#### ####"))).toEqual([
      { start: 0, size: 4, text: "1234" },
      { start: 5, size: 4, text: "5" },
    ])
    expect(maskGroups("", parseMask("##/##"))).toHaveLength(2)
  })

  it("picks the group that takes the next key", () => {
    const groups = maskGroups("1234", parseMask("#### ####"))
    expect(activeGroupIndex(groups, 2, 4)).toBe(0)
    expect(activeGroupIndex(groups, 4, 4)).toBe(1)
    expect(activeGroupIndex(maskGroups("12345", parseMask("#### ####")), 4, 6)).toBe(0)
    expect(activeGroupIndex(maskGroups("12345", parseMask("#### ####")), 6, 6)).toBe(1)
    const led = maskGroups("", parseMask("(##) ##"))
    expect(activeGroupIndex(led, 0, 0)).toBe(0)
  })
})

describe("MaskInput", () => {
  const field = () => screen.getByRole("textbox")
  const setup = () => userEvent.setup()

  it("formats as you type and exposes raw and masked", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    render(<MaskInput mask="phone" aria-label="Phone" onValueChange={onValueChange} />)
    await user.type(field(), "5551234")
    expect(field()).toHaveValue("(555) 123-4")
    expect(onValueChange).toHaveBeenLastCalledWith("5551234", "(555) 123-4")
  })

  it("keeps the caret right when typing in the middle", async () => {
    const user = setup()
    render(<MaskInput mask="date" aria-label="Date" defaultValue="1234" />)
    const input = field() as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(1, 1)
    await user.keyboard("9")
    expect(input).toHaveValue("19/23/4")
    // Past the slash: the next key belongs to the next group.
    expect(input.selectionStart).toBe(3)
    await user.keyboard("8")
    expect(input).toHaveValue("19/82/34")
    expect(input.selectionStart).toBe(4)
  })

  it("rejects a bad key without moving the caret", async () => {
    const user = setup()
    render(<MaskInput mask="date" aria-label="Date" defaultValue="1234" />)
    const input = field() as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(1, 1)
    await user.keyboard("x")
    expect(input).toHaveValue("12/34")
    expect(input.selectionStart).toBe(1)
  })

  it("Backspace right after a literal removes the digit before it", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    render(<MaskInput mask="date" aria-label="Date" defaultValue="1234" onValueChange={onValueChange} />)
    const input = field() as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(3, 3)
    await user.keyboard("{Backspace}")
    expect(input).toHaveValue("13/4")
    expect(input.selectionStart).toBe(1)
    expect(onValueChange).toHaveBeenLastCalledWith("134", "13/4")
  })

  it("Delete just before a literal removes the digit after it", async () => {
    const user = setup()
    render(<MaskInput mask="date" aria-label="Date" defaultValue="1234" />)
    const input = field() as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(2, 2)
    await user.keyboard("{Delete}")
    expect(input).toHaveValue("12/4")
    expect(input.selectionStart).toBe(2)
  })

  it("pastes into the middle with the caret after what landed", async () => {
    const user = setup()
    render(<MaskInput mask="card" aria-label="Card" defaultValue="4242" />)
    const input = field() as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(2, 2)
    await user.paste("99-88")
    expect(input).toHaveValue("4299 8842")
    expect(input.selectionStart).toBe(7)
  })

  it("calls onComplete when the last slot fills", async () => {
    const user = setup()
    const onComplete = vi.fn()
    render(<MaskInput mask="##-##" aria-label="Code" onComplete={onComplete} />)
    await user.type(field(), "123")
    expect(onComplete).not.toHaveBeenCalled()
    await user.type(field(), "4")
    expect(onComplete).toHaveBeenCalledWith("1234", "12-34")
  })

  it("works controlled, including a value that already has its literals", async () => {
    const user = setup()
    function Controlled() {
      const [raw, setRaw] = useState("12/3")
      return <MaskInput mask="date" aria-label="Date" value={raw} onValueChange={setRaw} />
    }
    render(<Controlled />)
    expect(field()).toHaveValue("12/3")
    await user.type(field(), "4")
    expect(field()).toHaveValue("12/34")
  })

  it("posts the raw value under the given name and asks for the number keyboard", () => {
    const { container } = render(<MaskInput mask="phone" aria-label="Phone" name="phone" defaultValue="5551234567" />)
    expect(container.querySelector<HTMLInputElement>("input[type='hidden']")?.value).toBe("5551234567")
    expect(field()).toHaveAttribute("inputmode", "numeric")
    expect(field()).not.toHaveAttribute("name")
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: MaskInputVariant) => {
      const { container, unmount } = render(<MaskInput mask="##-##" aria-label="Code" variant={variant} />)
      const input = container.querySelector("[data-slot='mask-input-field']") as HTMLInputElement
      const result = {
        groups: container.querySelectorAll("[data-slot='mask-input-group']").length,
        cells: container.querySelectorAll("[data-slot='mask-input-cell']").length,
        overlay: input.className.includes("opacity-0"),
        sized: input.style.width !== "",
      }
      unmount()
      return result
    }
    expect(shape("plain")).toEqual({ groups: 0, cells: 0, overlay: false, sized: false })
    expect(shape("grouped")).toEqual({ groups: 2, cells: 0, overlay: true, sized: false })
    expect(shape("compact")).toEqual({ groups: 0, cells: 0, overlay: false, sized: true })
    expect(shape("otp-like")).toEqual({ groups: 0, cells: 4, overlay: true, sized: false })
  })

  it("marks the box holding the caret, and pressing a box moves the caret to it", async () => {
    const user = setup()
    const { container } = render(<MaskInput mask="#### ####" aria-label="Card" variant="grouped" defaultValue="12345" />)
    const input = field() as HTMLInputElement
    await user.click(input)
    const groups = container.querySelectorAll<HTMLElement>("[data-slot='mask-input-group']")
    groups[0].getBoundingClientRect = () => ({ left: 0, right: 100 }) as DOMRect
    groups[1].getBoundingClientRect = () => ({ left: 110, right: 210 }) as DOMRect
    fireEvent.click(input, { clientX: 50 })
    expect(input.selectionStart).toBe(4)
    expect(groups[0]).toHaveAttribute("data-active", "true")
    expect(groups[1]).toHaveAttribute("data-active", "false")
    fireEvent.click(input, { clientX: 150 })
    expect(input.selectionStart).toBe(6)
    expect(groups[1]).toHaveAttribute("data-active", "true")
  })
})
