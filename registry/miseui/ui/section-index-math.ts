import { clampUnit } from "@/registry/miseui/lib/motion"

interface SectionIndexItem {
  /** The id of the section element on the page. */
  id: string
  title: string
  /** The label beside the title. Defaults to the position, zero padded. */
  no?: string
}

interface SectionBox {
  top: number
  height: number
}

type SectionStatus = "done" | "current" | "ahead"

/** The line people are reading at: a little above the middle, where the eye rests in a long page. */
const READING_LINE = 0.4

function readingLine(viewportTop: number, viewportHeight: number) {
  return viewportTop + viewportHeight * READING_LINE
}

/** The last section whose top has passed the line, or -1 above the first. A short last section can never reach the line, so the end of the scroll selects it. */
function currentSection(boxes: readonly SectionBox[], line: number, atEnd: boolean) {
  if (atEnd) return boxes.length - 1
  return boxes.reduce((current, box, index) => (box.top <= line ? index : current), -1)
}

function sectionProgress(box: SectionBox | undefined, line: number) {
  if (!box || box.height <= 0) return 0
  return clampUnit((line - box.top) / box.height)
}

/** How far through the whole document, counting finished sections as whole. */
function overallProgress(current: number, withinSection: number, count: number) {
  if (count <= 0 || current < 0) return 0
  return clampUnit((current + withinSection) / count)
}

function sectionStatus(index: number, current: number): SectionStatus {
  if (index === current) return "current"
  return index < current ? "done" : "ahead"
}

function sectionNumber(item: SectionIndexItem, index: number) {
  return item.no ?? String(index + 1).padStart(2, "0")
}

function atScrollEnd(scrollTop: number, clientHeight: number, scrollHeight: number) {
  // A page that does not scroll is at no end; the first section is simply being read. Two pixels forgive fractional zoom.
  return scrollHeight > clientHeight && scrollTop + clientHeight >= scrollHeight - 2
}

export { atScrollEnd, currentSection, overallProgress, readingLine, sectionNumber, sectionProgress, sectionStatus, type SectionBox, type SectionIndexItem, type SectionStatus }
