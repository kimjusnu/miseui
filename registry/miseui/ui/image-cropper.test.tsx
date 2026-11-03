import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageCropper, cropToBlob, type ImageCropperProps, type ImageCropperVariant } from "./image-cropper"
import { centerView, clampView, coverScale, cropFromView, dragView, fitFrame, intersect, resizeFrame, viewFromCrop, zoomAt, type CropRect } from "./image-cropper-math"
import { nextGeometry } from "./image-cropper-state"

const STAGE = { width: 320, height: 240 }
const observers: { callback: ResizeObserverCallback }[] = []

class ResizeObserverStub {
  readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    observers.push(this)
  }
  observe = () => this.callback([{ contentRect: STAGE } as ResizeObserverEntry], this as unknown as ResizeObserver)
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
})

afterAll(() => vi.unstubAllGlobals())

const IMAGE = { width: 800, height: 600 }
const FRAME: CropRect = { x: 40, y: 20, width: 240, height: 200 }

const insideImage = (crop: CropRect) => {
  expect(crop.x).toBeGreaterThanOrEqual(0)
  expect(crop.y).toBeGreaterThanOrEqual(0)
  expect(crop.x + crop.width).toBeLessThanOrEqual(IMAGE.width)
  expect(crop.y + crop.height).toBeLessThanOrEqual(IMAGE.height)
}

describe("crop geometry", () => {
  it("fitFrame fits the shape inside the inset and centres it", () => {
    expect(fitFrame(STAGE, 1, 16)).toEqual({ x: 56, y: 16, width: 208, height: 208 })
    expect(fitFrame(STAGE, 16 / 9, 0)).toEqual({ x: 0, y: 30, width: 320, height: 180 })
    expect(fitFrame(STAGE, null, 16)).toEqual({ x: 16, y: 16, width: 288, height: 208 })
  })

  it("clampView keeps the frame covered whatever is asked", () => {
    const least = coverScale(IMAGE, FRAME)
    expect(clampView({ scale: 0.001, x: 0, y: 0 }, IMAGE, FRAME).scale).toBe(least)
    const pushed = clampView({ scale: 1, x: 500, y: 500 }, IMAGE, FRAME)
    expect(pushed.x).toBe(FRAME.x)
    expect(pushed.y).toBe(FRAME.y)
    const pulled = clampView({ scale: 1, x: -5000, y: -5000 }, IMAGE, FRAME)
    expect(pulled.x).toBe(FRAME.x + FRAME.width - IMAGE.width)
    expect(pulled.y).toBe(FRAME.y + FRAME.height - IMAGE.height)
    expect(clampView({ scale: 100, x: 0, y: 0 }, IMAGE, FRAME, 4).scale).toBe(least * 4)
  })

  it("the crop never leaves the image, from any view at all", () => {
    const views = [
      { scale: 0.001, x: 9999, y: -9999 },
      { scale: 50, x: -9999, y: 9999 },
      { scale: 1, x: 40.4, y: 20.6 },
    ]
    views.forEach((view) => insideImage(cropFromView(clampView(view, IMAGE, FRAME), FRAME, IMAGE)))
    insideImage(cropFromView({ scale: 0.3, x: 500, y: 500 }, FRAME, IMAGE))
  })

  it("view and crop are inverses", () => {
    const crop = { x: 120, y: 80, width: 480, height: 400 }
    expect(cropFromView(viewFromCrop(crop, FRAME), FRAME, IMAGE)).toEqual(crop)
  })

  it("zoomAt keeps the point under the fingers still", () => {
    const view = { scale: 1, x: -100, y: -100 }
    const focal = { x: 160, y: 120 }
    const next = zoomAt(view, 2, focal, IMAGE, FRAME)
    expect((focal.x - next.x) / next.scale).toBeCloseTo((focal.x - view.x) / view.scale)
    expect((focal.y - next.y) / next.scale).toBeCloseTo((focal.y - view.y) / view.scale)
  })

  it("dragView stops dead, or resists more the further past the edge when elastic", () => {
    const start = centerView(IMAGE, FRAME)
    expect(dragView(start, 9999, 0, IMAGE, FRAME).x).toBe(FRAME.x)
    const near = dragView({ ...start, x: FRAME.x }, 40, 0, IMAGE, FRAME, true).x - FRAME.x
    const far = dragView({ ...start, x: FRAME.x }, 400, 0, IMAGE, FRAME, true).x - FRAME.x
    expect(near).toBeGreaterThan(0)
    expect(near).toBeLessThan(40)
    expect(far).toBeGreaterThan(near)
    expect(far).toBeLessThan(400)
  })

  it("resizeFrame holds the far corner, stops at the bounds and at the minimum", () => {
    const bounds = { x: 0, y: 0, ...STAGE }
    const grown = resizeFrame(FRAME, "se", 30, 10, bounds, 48)
    expect(grown).toEqual({ x: 40, y: 20, width: 270, height: 210 })
    const west = resizeFrame(FRAME, "nw", -500, -500, bounds, 48)
    expect(west.x).toBe(0)
    expect(west.y).toBe(0)
    expect(west.x + west.width).toBe(FRAME.x + FRAME.width)
    const tiny = resizeFrame(FRAME, "se", -999, -999, bounds, 48)
    expect(tiny.width).toBe(48)
    expect(tiny.height).toBe(48)
  })

  it("resizeFrame holds a locked shape, even against the bounds", () => {
    const locked = resizeFrame({ x: 10, y: 10, width: 100, height: 100 }, "se", 500, 20, { x: 0, y: 0, width: 300, height: 150 }, 48, 1)
    expect(locked.width).toBeCloseTo(locked.height)
    expect(locked.y + locked.height).toBeLessThanOrEqual(150)
  })

  it("intersect and a stage resize keep the same pixels in the frame", () => {
    expect(intersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toEqual({ x: 5, y: 5, width: 5, height: 5 })
    const input = { image: IMAGE, aspect: 1, inset: 16, free: false, key: "k", initial: undefined }
    const first = nextGeometry({ ...input, stage: STAGE, previous: null })
    const moved = { ...first, view: zoomAt(first.view, first.view.scale * 2, { x: 100, y: 100 }, IMAGE, first.frame) }
    const before = cropFromView(moved.view, moved.frame, IMAGE)
    const resized = nextGeometry({ ...input, stage: { width: 200, height: 200 }, previous: moved })
    const after = cropFromView(resized.view, resized.frame, IMAGE)
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1)
  })
})

const Scene = () => <svg data-testid="scene" />
const renderCropper = (props: Partial<ImageCropperProps> = {}) =>
  render(
    <ImageCropper label="Photo" imageSize={IMAGE} {...props}>
      <Scene />
    </ImageCropper>,
  )
const stage = () => screen.getByRole("group", { name: "Photo" })
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement
const setup = () => userEvent.setup({ pointerEventsCheck: 0 })

describe("ImageCropper", () => {
  it.each<ImageCropperVariant>(["square", "circle", "wide"])("variant=%s has no corners to pull and reports a crop of its own shape", (variant) => {
    const onCropChange = vi.fn()
    renderCropper({ variant, onCropChange })
    expect(slot("image-cropper")).toHaveAttribute("data-variant", variant)
    expect(document.querySelectorAll("[data-slot='image-cropper-corner']")).toHaveLength(0)
    const crop = onCropChange.mock.calls[0][0] as CropRect
    expect(crop.width / crop.height).toBeCloseTo(variant === "wide" ? 16 / 9 : 1, 1)
    insideImage(crop)
  })

  it("variants differ in structure: free has corners, circle a round mask, square thirds while dragging", () => {
    const first = renderCropper({ variant: "free" })
    expect(document.querySelectorAll("[data-slot='image-cropper-corner']")).toHaveLength(4)
    first.unmount()
    const second = renderCropper({ variant: "circle" })
    expect(slot("image-cropper-frame")).toHaveClass("rounded-full")
    second.unmount()
    renderCropper({ variant: "square" })
    expect(slot("image-cropper-thirds")).toBeNull()
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    expect(slot("image-cropper-thirds")).toBeInTheDocument()
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    expect(slot("image-cropper-thirds")).toBeNull()
  })

  it("dragging moves the crop against the pointer and reports once on release", () => {
    const onCropChange = vi.fn()
    renderCropper({ onCropChange, defaultCrop: { x: 200, y: 100, width: 200, height: 200 } })
    onCropChange.mockClear()
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 90, clientY: 100 })
    expect(onCropChange).not.toHaveBeenCalled()
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    expect(onCropChange).toHaveBeenCalledTimes(1)
    const crop = onCropChange.mock.calls[0][0] as CropRect
    expect(crop.x).toBeGreaterThan(200)
    expect(crop.y).toBe(100)
  })

  it("a drag far past an edge still ends inside the image", () => {
    const onCropChange = vi.fn()
    renderCropper({ onCropChange })
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 5000, clientY: 5000 })
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    const crop = onCropChange.mock.lastCall?.[0] as CropRect
    expect(crop.x).toBe(0)
    expect(crop.y).toBe(0)
  })

  it("spring runs past the edge while held and comes back on release", () => {
    const onCropChange = vi.fn()
    renderCropper({ effect: "spring", onCropChange })
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 400, clientY: 0 })
    expect(slot("image-cropper")).toHaveAttribute("data-overscrolled", "true")
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    expect(slot("image-cropper")).not.toHaveAttribute("data-overscrolled")
    insideImage(onCropChange.mock.lastCall?.[0] as CropRect)
  })

  it("without the effect, the same drag never goes past", () => {
    renderCropper()
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 400, clientY: 0 })
    expect(slot("image-cropper")).not.toHaveAttribute("data-overscrolled")
    fireEvent.pointerUp(stage(), { pointerId: 1 })
  })

  it("two fingers pinch to zoom in, so the crop gets smaller", () => {
    const onCropChange = vi.fn()
    renderCropper({ onCropChange })
    const before = onCropChange.mock.lastCall?.[0] as CropRect
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerDown(stage(), { pointerId: 2, button: 0, clientX: 200, clientY: 100 })
    fireEvent.pointerMove(stage(), { pointerId: 2, clientX: 300, clientY: 100 })
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    fireEvent.pointerUp(stage(), { pointerId: 2 })
    const after = onCropChange.mock.lastCall?.[0] as CropRect
    expect(after.width).toBeLessThan(before.width)
    insideImage(after)
  })

  it("the wheel zooms, stops the page behind it, and cannot zoom out past the fit", () => {
    const onCropChange = vi.fn()
    renderCropper({ onCropChange })
    const before = onCropChange.mock.lastCall?.[0] as CropRect
    const event = new WheelEvent("wheel", { deltaY: -200, cancelable: true, bubbles: true })
    act(() => stage().dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
    expect((onCropChange.mock.lastCall?.[0] as CropRect).width).toBeLessThan(before.width)
    act(() => stage().dispatchEvent(new WheelEvent("wheel", { deltaY: 99999, cancelable: true, bubbles: true })))
    expect((onCropChange.mock.lastCall?.[0] as CropRect).width).toBe(before.width)
  })

  it("arrow keys nudge, shift goes further, plus and minus zoom, and each move is spoken", async () => {
    const user = setup()
    const onCropChange = vi.fn()
    renderCropper({ onCropChange, defaultCrop: { x: 200, y: 100, width: 200, height: 200 } })
    await user.tab()
    expect(stage()).toHaveFocus()
    const start = onCropChange.mock.lastCall?.[0] as CropRect
    await user.keyboard("{ArrowRight}")
    const right = onCropChange.mock.lastCall?.[0] as CropRect
    expect(right.x).toBeGreaterThan(start.x)
    expect(slot("image-cropper-live")).toHaveTextContent(`Crop ${right.width} by ${right.height}, at ${right.x}, ${right.y}`)
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}")
    expect((onCropChange.mock.lastCall?.[0] as CropRect).y).toBeGreaterThan(start.y + 1)
    await user.keyboard("+")
    expect((onCropChange.mock.lastCall?.[0] as CropRect).width).toBeLessThan(start.width)
  })

  it("a corner resizes by pointer and by keyboard, never past the image", async () => {
    const user = setup()
    const onCropChange = vi.fn()
    renderCropper({ variant: "free", onCropChange })
    const before = onCropChange.mock.lastCall?.[0] as CropRect
    const corner = screen.getByRole("button", { name: "Resize crop from the bottom right corner" })
    fireEvent.pointerDown(corner, { pointerId: 1, button: 0, clientX: 300, clientY: 200 })
    fireEvent.pointerMove(corner, { pointerId: 1, clientX: 250, clientY: 150 })
    fireEvent.pointerUp(corner, { pointerId: 1 })
    const smaller = onCropChange.mock.lastCall?.[0] as CropRect
    expect(smaller.width).toBeLessThan(before.width)
    corner.focus()
    await user.keyboard("{ArrowRight}")
    expect((onCropChange.mock.lastCall?.[0] as CropRect).width).toBeGreaterThan(smaller.width)
  })

  it("the zoom slider changes the crop from its own value", async () => {
    const user = setup()
    const onCropChange = vi.fn()
    renderCropper({ onCropChange })
    const before = onCropChange.mock.lastCall?.[0] as CropRect
    const slider = screen.getByRole("slider", { name: "Zoom" })
    expect(slider).toHaveAttribute("aria-valuetext", "100%")
    slider.focus()
    await user.keyboard("{End}")
    expect((onCropChange.mock.lastCall?.[0] as CropRect).width).toBe(Math.round(before.width / 4))
  })

  it("disabled takes no focus and ignores the pointer", () => {
    const onCropChange = vi.fn()
    renderCropper({ disabled: true, onCropChange })
    onCropChange.mockClear()
    expect(stage()).not.toHaveAttribute("tabindex")
    expect(stage()).toHaveAttribute("aria-disabled", "true")
    fireEvent.pointerDown(stage(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 50, clientY: 0 })
    fireEvent.pointerUp(stage(), { pointerId: 1 })
    expect(onCropChange).not.toHaveBeenCalled()
  })

  it("src reads its size from the file", () => {
    render(<ImageCropper label="Photo" src="/photo.jpg" />)
    const img = screen.getByRole("img", { name: "Photo" }) as HTMLImageElement
    expect(slot("image-cropper-frame")).toBeNull()
    Object.defineProperty(img, "naturalWidth", { value: 400 })
    Object.defineProperty(img, "naturalHeight", { value: 300 })
    fireEvent.load(img)
    expect(slot("image-cropper-frame")).toBeInTheDocument()
  })
})

describe("cropToBlob", () => {
  it("draws just the crop at full size and resolves the blob", async () => {
    const drawImage = vi.fn()
    const blob = new Blob(["x"])
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(blob))
    const source = {} as CanvasImageSource
    await expect(cropToBlob(source, { x: 10, y: 20, width: 30, height: 40 })).resolves.toBe(blob)
    expect(drawImage).toHaveBeenCalledWith(source, 10, 20, 30, 40, 0, 0, 30, 40)
    getContext.mockRestore()
    toBlob.mockRestore()
  })

  it("rejects clearly when the browser gives no canvas", async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    await expect(cropToBlob({} as CanvasImageSource, { x: 0, y: 0, width: 1, height: 1 })).rejects.toThrow("cannot draw")
    getContext.mockRestore()
  })
})
