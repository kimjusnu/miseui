import { act, fireEvent, render, screen } from "@testing-library/react"
import { Avatar, AvatarGroup, avatarTone, getInitials, type AvatarStatus } from "./avatar"

const NAMES = ["Mina Park", "Tomas Reyes", "Aisha Khan", "Leo Martin", "Hana Sato", "Noor Ali"]

describe("getInitials", () => {
  it("takes first and last word, uppercases, survives odd input", () => {
    expect(getInitials("Mina Park")).toBe("MP")
    expect(getInitials("mina de la cruz")).toBe("MC")
    expect(getInitials("Cher")).toBe("C")
    expect(getInitials("  ")).toBe("?")
    expect(getInitials("김준수")).toBe("김")
  })
})

describe("avatarTone", () => {
  it("is deterministic and only uses theme tokens", () => {
    NAMES.forEach((name) => {
      expect(avatarTone(name)).toBe(avatarTone(name))
      expect(avatarTone(name)).toMatch(/^bg-(muted|mise-soft|mise\/30|primary|mise) text-(foreground|primary-foreground|mise-foreground)$/)
    })
  })

  it("spreads different names across more than one tone", () => {
    expect(new Set(NAMES.map(avatarTone)).size).toBeGreaterThan(1)
  })
})

describe("Avatar", () => {
  it("names the person once and shows initials when there is no image", () => {
    render(<Avatar name="Mina Park" />)
    const avatar = screen.getByRole("img", { name: "Mina Park" })
    expect(avatar).toHaveTextContent("MP")
    expect(avatar.querySelector("[data-slot='avatar-fallback']")).toHaveClass(...avatarTone("Mina Park").split(" "))
  })

  it("swaps to the image once it has loaded", async () => {
    const realImage = window.Image
    class LoadedImage extends EventTarget {
      complete = true
      naturalWidth = 40
      referrerPolicy = ""
      crossOrigin = null
      set src(_value: string) {
        queueMicrotask(() => this.dispatchEvent(new Event("load")))
      }
    }
    window.Image = LoadedImage as unknown as typeof Image
    render(<Avatar name="Mina Park" src="/mina.jpg" />)
    await act(async () => {
      await Promise.resolve()
    })
    const avatar = screen.getByRole("img", { name: "Mina Park" })
    expect(avatar.querySelector("img")).toHaveAttribute("src", "/mina.jpg")
    expect(avatar.querySelector("[data-slot='avatar-fallback']")).toBeNull()
    window.Image = realImage
  })

  it("each variant has its own structure", () => {
    render(
      <>
        <Avatar name="A Circle" variant="circle" data-testid="circle" />
        <Avatar name="B Rounded" variant="rounded" data-testid="rounded" />
        <Avatar name="C Ring" variant="ring" data-testid="ring" />
        <Avatar name="D Status" variant="status" data-testid="status" />
      </>,
    )
    const inner = (id: string) => screen.getByTestId(id).firstElementChild
    expect(inner("circle")).toHaveClass("rounded-full")
    expect(inner("rounded")).toHaveClass("rounded-lg")
    expect(inner("ring")).toHaveClass("ring-mise")
    expect(screen.getByTestId("status").querySelector("[data-slot='avatar-status']")).not.toBeNull()
    expect(screen.getByTestId("circle").querySelector("[data-slot='avatar-status']")).toBeNull()
  })

  it.each<AvatarStatus>(["online", "away", "busy", "offline"])("announces %s presence", (status) => {
    render(<Avatar name="Mina Park" variant="status" status={status} />)
    const avatar = screen.getByRole("img", { name: `Mina Park, ${status}` })
    expect(avatar.querySelector("[data-slot='avatar-status']")).toHaveAttribute("data-status", status)
  })

  it("applies the size", () => {
    render(<Avatar name="Mina Park" size="lg" />)
    expect(screen.getByRole("img").firstElementChild).toHaveClass("size-12")
  })
})

describe("AvatarGroup", () => {
  const people = NAMES.map((name) => <Avatar key={name} name={name} />)

  it("caps the faces and counts the rest", () => {
    render(<AvatarGroup max={3}>{people}</AvatarGroup>)
    expect(screen.getByRole("group", { name: "6 people" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "3 more" })).toHaveTextContent("+3")
    expect(screen.queryByRole("img", { name: "Leo Martin" })).toBeNull()
  })

  it("uses an explicit total when the children are only a page", () => {
    render(
      <AvatarGroup max={2} total={40}>
        {people.slice(0, 2)}
      </AvatarGroup>,
    )
    expect(screen.getByRole("img", { name: "38 more" })).toBeInTheDocument()
  })

  it("hands size and variant to its faces", () => {
    render(
      <AvatarGroup size="sm" variant="rounded" max={1}>
        {people}
      </AvatarGroup>,
    )
    const face = screen.getByRole("img", { name: "Mina Park" })
    expect(face).toHaveAttribute("data-size", "sm")
    expect(face).toHaveAttribute("data-variant", "rounded")
  })

  it("stack spreads on hover and on focus, then settles back", () => {
    render(
      <AvatarGroup effect="stack">
        <Avatar name="Mina Park" />
        <button type="button">Invite</button>
      </AvatarGroup>,
    )
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("data-effect", "stack")
    expect(group).toHaveAttribute("data-spread", "false")
    fireEvent.pointerEnter(group)
    expect(group).toHaveAttribute("data-spread", "true")
    fireEvent.pointerLeave(group)
    expect(group).toHaveAttribute("data-spread", "false")
    fireEvent.focus(screen.getByRole("button", { name: "Invite" }))
    expect(group).toHaveAttribute("data-spread", "true")
  })

  it("does not spread without the effect", () => {
    render(<AvatarGroup>{people}</AvatarGroup>)
    const group = screen.getByRole("group")
    fireEvent.pointerEnter(group)
    expect(group).not.toHaveAttribute("data-spread")
  })
})
