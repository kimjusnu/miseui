import { createEvent, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FileUpload, type FileUploadItem, type FileUploadProps, type FileUploadVariant } from "./file-upload"
import { formatBytes, matchesAccept, uniqueMessages, validateFiles } from "./file-upload-math"

const MB = 1024 * 1024
const makeFile = (name: string, type: string, size = 10) => {
  const file = new File(["x"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}
const PDF = makeFile("report.pdf", "application/pdf", MB)
const PNG = makeFile("photo.png", "image/png", MB)
const LARGE = makeFile("movie.pdf", "application/pdf", 9 * MB)

const setup = () => userEvent.setup({ pointerEventsCheck: 0, applyAccept: false })
const renderUpload = (props: Partial<FileUploadProps> = {}) => render(<FileUpload {...props} />)
const input = () => document.querySelector("input[type='file']") as HTMLInputElement
const zone = () => document.querySelector("[data-slot='file-upload-zone']") as HTMLElement
const drop = (files: File[]) => fireEvent.drop(zone(), { dataTransfer: { files } })

describe("file upload math", () => {
  it("formatBytes picks the unit and keeps one decimal only for small values", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(15 * MB)).toBe("15 MB")
  })

  it("matchesAccept understands extensions, wildcards and exact types, ignoring case", () => {
    expect(matchesAccept(PDF, ".PDF")).toBe(true)
    expect(matchesAccept(PNG, "image/*")).toBe(true)
    expect(matchesAccept(PNG, "image/jpeg, application/pdf")).toBe(false)
    expect(matchesAccept(makeFile("no-type.csv", ""), ".csv")).toBe(true)
    expect(matchesAccept(PDF, undefined)).toBe(true)
  })

  it("validateFiles reports the first reason for each file and counts what is already there", () => {
    const { accepted, rejected } = validateFiles([PDF, PNG, LARGE], { accept: ".pdf", maxSize: 5 * MB })
    expect(accepted).toEqual([PDF])
    expect(rejected.map((entry) => entry.reason)).toEqual(["type", "size"])
    const counted = validateFiles([PDF, PNG], { maxFiles: 2, existing: 1 })
    expect(counted.accepted).toEqual([PDF])
    expect(counted.rejected[0].reason).toBe("count")
  })

  it("uniqueMessages folds repeated sentences into one", () => {
    const { rejected } = validateFiles([PDF, PNG, LARGE], { maxFiles: 0 })
    expect(uniqueMessages(rejected)).toHaveLength(1)
  })
})

describe("FileUpload", () => {
  it.each<[FileUploadVariant, string]>([
    ["dropzone", "Drop files here, or browse"],
    ["button", "Choose files"],
    ["compact", "Browse"],
    ["avatar", "Change photo"],
  ])("%s marks itself and names a real file input with its own action", (variant, name) => {
    renderUpload({ variant })
    expect(document.querySelector("[data-slot='file-upload']")).toHaveAttribute("data-variant", variant)
    expect(input()).toHaveAccessibleName(name)
    expect(zone().tagName).toBe("LABEL")
    expect(zone()).toContainElement(input())
  })

  it("the input is reachable by keyboard, and the zone shows focus", async () => {
    const user = setup()
    renderUpload()
    await user.tab()
    expect(input()).toHaveFocus()
    expect(zone().className).toContain("focus-within:ring")
  })

  it("avatar shows the picture and a remove action instead of a list, and only takes one file", async () => {
    const user = setup()
    const onFilesAccepted = vi.fn()
    const items: FileUploadItem[] = [{ id: "a", name: "me.png", size: 10, previewUrl: "blob:me", status: "done" }]
    renderUpload({ variant: "avatar", items, onFilesAccepted, onRemove: vi.fn() })
    expect(document.querySelector("img")).toHaveAttribute("src", "blob:me")
    expect(document.querySelector("[data-slot='file-upload-list']")).toBeNull()
    expect(input()).not.toHaveAttribute("multiple")
    await user.upload(input(), PNG)
    expect(onFilesAccepted).toHaveBeenCalledWith([PNG])
  })

  it("compact drops the size and the progress bar; dropzone keeps both", () => {
    const items: FileUploadItem[] = [{ id: "a", name: "report.pdf", size: MB, status: "uploading", progress: 40 }]
    const { unmount } = renderUpload({ variant: "compact", items })
    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(screen.getByText("40%")).toBeInTheDocument()
    unmount()
    renderUpload({ items })
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40")
    expect(screen.getByText("1 MB, 40%")).toBeInTheDocument()
  })

  it("choosing files passes the accepted ones to the owner, and the same file can be picked twice", async () => {
    const user = setup()
    const onFilesAccepted = vi.fn()
    renderUpload({ onFilesAccepted, multiple: true })
    await user.upload(input(), [PDF, PNG])
    expect(onFilesAccepted).toHaveBeenCalledWith([PDF, PNG])
    expect(input().value).toBe("")
  })

  it("dropping checks the limits, shows every distinct reason as an alert and clears on the next good try", () => {
    const onFilesAccepted = vi.fn()
    const onFilesRejected = vi.fn()
    renderUpload({ accept: ".pdf", maxSize: 5 * MB, onFilesAccepted, onFilesRejected })
    drop([PDF, PNG, LARGE])
    expect(onFilesAccepted).toHaveBeenCalledWith([PDF])
    expect(onFilesRejected.mock.calls[0][0]).toHaveLength(2)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("photo.png is not an accepted file type.")
    expect(alert).toHaveTextContent("movie.pdf is larger than 5 MB.")
    drop([PDF])
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("maxFiles counts the rows already in the list", () => {
    const onFilesAccepted = vi.fn()
    const items: FileUploadItem[] = [{ id: "a", name: "one.pdf", size: 1 }]
    renderUpload({ items, maxFiles: 1, onFilesAccepted })
    drop([PDF])
    expect(onFilesAccepted).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Only one file can be added.")
  })

  it("messages can be replaced for another language", () => {
    renderUpload({ maxSize: 1, messages: { size: (file) => `${file.name}: 용량 초과` } })
    drop([PDF])
    expect(screen.getByRole("alert")).toHaveTextContent("report.pdf: 용량 초과")
  })

  it("marks the zone while a file is over it, and ignores moves between its children", () => {
    renderUpload()
    fireEvent.dragEnter(zone())
    expect(zone()).toHaveAttribute("data-dragging", "true")
    // jsdom has no DragEvent, so its generic event drops relatedTarget unless it is put back by hand.
    const leaveTo = (relatedTarget: Element) => {
      const event = createEvent.dragLeave(zone())
      Object.defineProperty(event, "relatedTarget", { value: relatedTarget })
      fireEvent(zone(), event)
    }
    leaveTo(input())
    expect(zone()).toHaveAttribute("data-dragging", "true")
    leaveTo(document.body)
    expect(zone()).not.toHaveAttribute("data-dragging")
  })

  it("remove and retry report the row, and only a failed row offers retry", async () => {
    const user = setup()
    const onRemove = vi.fn()
    const onRetry = vi.fn()
    const items: FileUploadItem[] = [
      { id: "ok", name: "ok.pdf", size: 1, status: "done" },
      { id: "bad", name: "bad.pdf", size: 1, status: "error", error: "Connection lost" },
    ]
    renderUpload({ items, onRemove, onRetry })
    expect(screen.getByText("Connection lost")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Retry ok.pdf" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Retry bad.pdf" }))
    expect(onRetry).toHaveBeenCalledWith("bad")
    await user.click(screen.getByRole("button", { name: "Remove ok.pdf" }))
    expect(onRemove).toHaveBeenCalledWith("ok")
  })

  it("success uses a fixed green, never the accent", () => {
    renderUpload({ items: [{ id: "ok", name: "ok.pdf", size: 1, status: "done" }] })
    const icon = document.querySelector("[data-slot='file-upload-row'] svg")
    expect(icon?.getAttribute("class")).toContain("emerald")
  })

  it("an unknown progress leaves aria-valuenow out, which is what indeterminate means", () => {
    renderUpload({ items: [{ id: "a", name: "a.pdf", size: 1, status: "uploading" }] })
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow")
  })

  it("disabled refuses files by any route and disables the input", () => {
    const onFilesAccepted = vi.fn()
    renderUpload({ disabled: true, onFilesAccepted })
    expect(input()).toBeDisabled()
    drop([PDF])
    expect(onFilesAccepted).not.toHaveBeenCalled()
  })

  it("materialize marks the effect and keeps the rows", () => {
    renderUpload({ effect: "materialize", items: [{ id: "a", name: "a.pdf", size: 1 }] })
    expect(document.querySelector("[data-slot='file-upload']")).toHaveAttribute("data-effect", "materialize")
    expect(screen.getByText("a.pdf")).toBeInTheDocument()
  })
})
