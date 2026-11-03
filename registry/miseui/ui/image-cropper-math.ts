import { rubberband } from "@/registry/miseui/lib/motion"

interface CropSize {
  width: number
  height: number
}

interface CropPoint {
  x: number
  y: number
}

/** A rectangle. In the stage's px for the frame, in the image's own px for the crop. */
interface CropRect extends CropPoint, CropSize {}

/** Where the image sits under the frame: its top-left corner in stage px, and its scale. */
interface CropView extends CropPoint {
  scale: number
}

type CropCorner = "nw" | "ne" | "sw" | "se"

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(low, high), Math.max(low, value))

/** The largest box of this shape inside the stage, centred. No aspect means the stage itself. */
function fitFrame(stage: CropSize, aspect: number | null, inset = 16): CropRect {
  const room = { width: Math.max(1, stage.width - inset * 2), height: Math.max(1, stage.height - inset * 2) }
  const wide = aspect !== null && room.width / room.height > aspect
  const width = aspect === null ? room.width : wide ? room.height * aspect : room.width
  const height = aspect === null ? room.height : wide ? room.height : room.width / aspect
  return { x: (stage.width - width) / 2, y: (stage.height - height) / 2, width, height }
}

/** The smallest scale at which the image still covers the frame: zooming out further would crop thin air. */
const coverScale = (image: CropSize, frame: CropSize) => Math.max(frame.width / image.width, frame.height / image.height)

function panBounds(scale: number, image: CropSize, frame: CropRect) {
  return {
    minX: frame.x + frame.width - image.width * scale,
    maxX: frame.x,
    minY: frame.y + frame.height - image.height * scale,
    maxY: frame.y,
  }
}

function clampView(view: CropView, image: CropSize, frame: CropRect, maxZoom = Number.POSITIVE_INFINITY): CropView {
  const least = coverScale(image, frame)
  const scale = clamp(view.scale, least, least * maxZoom)
  const bounds = panBounds(scale, image, frame)
  return { scale, x: clamp(view.x, bounds.minX, bounds.maxX), y: clamp(view.y, bounds.minY, bounds.maxY) }
}

function centerView(image: CropSize, target: CropRect, scale = coverScale(image, target)): CropView {
  return { scale, x: target.x + (target.width - image.width * scale) / 2, y: target.y + (target.height - image.height * scale) / 2 }
}

/** Zooms around a point, so whatever is under the fingers or the cursor stays under them. */
function zoomAt(view: CropView, nextScale: number, focal: CropPoint, image: CropSize, frame: CropRect, maxZoom?: number): CropView {
  const least = coverScale(image, frame)
  const scale = clamp(nextScale, least, maxZoom === undefined ? Number.POSITIVE_INFINITY : least * maxZoom)
  const ratio = scale / view.scale
  return clampView({ scale, x: focal.x - (focal.x - view.x) * ratio, y: focal.y - (focal.y - view.y) * ratio }, image, frame, maxZoom)
}

function elasticAxis(value: number, low: number, high: number, dimension: number) {
  if (value > high) return high + rubberband(value - high, dimension)
  if (value < low) return low + rubberband(value - low, dimension)
  return value
}

/** Past an edge the image either stops dead or, when `elastic`, follows with growing resistance until released. */
function dragView(start: CropView, dx: number, dy: number, image: CropSize, frame: CropRect, elastic = false): CropView {
  const raw = { scale: start.scale, x: start.x + dx, y: start.y + dy }
  if (!elastic) return clampView(raw, image, frame)
  const bounds = panBounds(start.scale, image, frame)
  return {
    scale: start.scale,
    x: elasticAxis(raw.x, bounds.minX, bounds.maxX, frame.width),
    y: elasticAxis(raw.y, bounds.minY, bounds.maxY, frame.height),
  }
}

/** The answer, in the image's own px. Clamped again here because rounding must not step outside the image either. */
function cropFromView(view: CropView, frame: CropRect, image: CropSize): CropRect {
  const width = Math.min(image.width, Math.round(frame.width / view.scale))
  const height = Math.min(image.height, Math.round(frame.height / view.scale))
  return {
    x: clamp(Math.round((frame.x - view.x) / view.scale), 0, image.width - width),
    y: clamp(Math.round((frame.y - view.y) / view.scale), 0, image.height - height),
    width,
    height,
  }
}

function viewFromCrop(crop: CropRect, frame: CropRect): CropView {
  const scale = frame.width / crop.width
  return { scale, x: frame.x - crop.x * scale, y: frame.y - crop.y * scale }
}

const imageRect = (view: CropView, image: CropSize): CropRect => ({ x: view.x, y: view.y, width: image.width * view.scale, height: image.height * view.scale })

function intersect(a: CropRect, b: CropRect): CropRect {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) }
}

function lockedSize(rawWidth: number, rawHeight: number, roomX: number, roomY: number, aspect: number, least: number) {
  const fitted = Math.min(Math.max(rawWidth, rawHeight * aspect), roomX, roomY * aspect)
  const width = Math.min(Math.max(fitted, least), roomX, roomY * aspect)
  return { width, height: width / aspect }
}

/** Moves one corner; the opposite corner stays put. `bounds` is where the image and stage overlap, so the frame can never leave the image. */
function resizeFrame(frame: CropRect, corner: CropCorner, dx: number, dy: number, bounds: CropRect, least: number, aspect: number | null = null): CropRect {
  const west = corner.endsWith("w")
  const north = corner.startsWith("n")
  const anchorX = west ? frame.x + frame.width : frame.x
  const anchorY = north ? frame.y + frame.height : frame.y
  const roomX = west ? anchorX - bounds.x : bounds.x + bounds.width - anchorX
  const roomY = north ? anchorY - bounds.y : bounds.y + bounds.height - anchorY
  const rawWidth = frame.width + (west ? -dx : dx)
  const rawHeight = frame.height + (north ? -dy : dy)
  const size = aspect
    ? lockedSize(rawWidth, rawHeight, roomX, roomY, aspect, least)
    : { width: Math.min(Math.max(rawWidth, least), roomX), height: Math.min(Math.max(rawHeight, least), roomY) }
  return { x: west ? anchorX - size.width : anchorX, y: north ? anchorY - size.height : anchorY, ...size }
}

const scaleFrame = (frame: CropRect, from: CropSize, to: CropSize): CropRect => {
  const ratioX = to.width / from.width
  const ratioY = to.height / from.height
  return { x: frame.x * ratioX, y: frame.y * ratioY, width: frame.width * ratioX, height: frame.height * ratioY }
}

const sameRect = (a: CropRect | null, b: CropRect | null) => a?.x === b?.x && a?.y === b?.y && a?.width === b?.width && a?.height === b?.height

export {
  centerView,
  clampView,
  coverScale,
  cropFromView,
  dragView,
  fitFrame,
  imageRect,
  intersect,
  resizeFrame,
  sameRect,
  scaleFrame,
  viewFromCrop,
  zoomAt,
  type CropCorner,
  type CropPoint,
  type CropRect,
  type CropSize,
  type CropView,
}
