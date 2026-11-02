import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act, useState } from "react"
import { Tag, type TagProps, type TagTone, type TagVariant } from "./tag"

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
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly TagVariant[] = ["soft", "outline", "solid", "dot"]
const TONES: readonly TagTone[] = ["neutral", "accent", "success", "warning", "error"]
const root = (container: HTMLElement) => container.querySelector("[data-slot='tag']") as HTMLElement

function Removable({ initial, ...props }: Partial<TagProps> & { initial: readonly string[] }) {
  const [tags, setTags] = useState(initial)
  return (
    <div className="flex gap-2">
      {tags.map((tag) => (
        <Tag key={tag} removeLabel={`Remove ${tag}`} onRemove={() => setTags((list) => list.filter((entry) => entry !== tag))} {...props}>
          {tag}
        </Tag>
      ))}
    </div>
  )
}

describe("Tag", () => {
  it.each(VARIANTS)("%s is plain text when nothing makes it interactive", (variant) => {
    const { container } = render(<Tag variant={variant}>Design</Tag>)
    expect(root(container)).toHaveAttribute("data-variant", variant)
    expect(screen.getByText("Design")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("draws a status dot only in the dot variant", () => {
    const dot = render(
      <Tag variant="dot" tone="success">
        Paid
      </Tag>,
    )
    expect(dot.container.querySelector("[data-slot='tag-dot']")).toHaveClass("bg-emerald-500")
    dot.unmount()
    const soft = render(<Tag tone="success">Paid</Tag>)
    expect(soft.container.querySelector("[data-slot='tag-dot']")).toBeNull()
  })

  it("never spends the accent on a status tone", () => {
    for (const variant of VARIANTS) {
      for (const tone of TONES) {
        const { container, unmount } = render(
          <Tag variant={variant} tone={tone}>
            Label
          </Tag>,
        )
        const classes = `${root(container).className} ${container.querySelector("[data-slot='tag-dot']")?.className ?? ""}`
        expect(/\bmise/.test(classes)).toBe(tone === "accent")
        unmount()
      }
    }
  })

  it("keeps white text off the light dark-mode error colour on solid", () => {
    const { container } = render(
      <Tag variant="solid" tone="error">
        Failed
      </Tag>,
    )
    expect(root(container)).toHaveClass("text-white", "dark:text-background")
  })

  it("becomes a button that reports pressed state when clickable", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Tag onClick={onClick} pressed>
        Design
      </Tag>,
    )
    const button = screen.getByRole("button", { name: "Design" })
    expect(button).toHaveAttribute("aria-pressed", "true")
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("keeps a clickable tag and its remove button as two separate targets", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onRemove = vi.fn()
    render(
      <Tag onClick={onClick} onRemove={onRemove} removeLabel="Remove design">
        Design
      </Tag>,
    )
    await user.click(screen.getByRole("button", { name: "Remove design" }))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onClick).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Design" }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole("button", { name: "Design" }).querySelector("[data-slot='tag-remove']")).toBeNull()
  })

  it("removes at once without the effect, moving focus to the neighbour", async () => {
    const user = userEvent.setup()
    render(<Removable initial={["Design", "Research", "Copy"]} />)
    const button = screen.getByRole("button", { name: "Remove Research" })
    button.focus()
    await user.keyboard("{Enter}")
    expect(screen.queryByText("Research")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove Copy" })).toHaveFocus()
  })

  it("falls back to the previous tag when the last one goes", async () => {
    const user = userEvent.setup()
    render(<Removable initial={["Design", "Copy"]} />)
    await user.click(screen.getByRole("button", { name: "Remove Copy" }))
    expect(screen.getByRole("button", { name: "Remove Design" })).toHaveFocus()
  })

  it("collapse waits for the row to close before reporting removal, and only once", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const { container } = render(
      <Tag effect="collapse" onRemove={onRemove} removeLabel="Remove design">
        Design
      </Tag>,
    )
    await user.click(screen.getByRole("button", { name: "Remove design" }))
    expect(root(container)).toHaveAttribute("data-closing", "true")
    expect(root(container)).toHaveClass("overflow-hidden")
    expect(root(container)).toHaveAttribute("inert")
    await waitFor(() => expect(onRemove).toHaveBeenCalledOnce(), { timeout: 3000 })
  })

  it("collapse removes at once when motion is reduced", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const { container } = render(
      <Tag effect="collapse" onRemove={onRemove} removeLabel="Remove design">
        Design
      </Tag>,
    )
    await user.click(screen.getByRole("button", { name: "Remove design" }))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(root(container)).not.toHaveAttribute("data-closing")
  })

  it("disables both targets", () => {
    render(
      <Tag disabled onClick={() => undefined} onRemove={() => undefined} removeLabel="Remove design">
        Design
      </Tag>,
    )
    expect(screen.getByRole("button", { name: "Design" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Remove design" })).toBeDisabled()
  })
})
