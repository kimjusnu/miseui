interface TocItem {
  id: string
  title: string
  /** Heading level, such as 2 for an h2. Only the differences matter; the shallowest becomes the top. */
  level?: number
}

type HeadingStatus = "above" | "inside" | "below"

/** Keeps letters of every alphabet, so a Korean or Japanese heading gets a real address. */
function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
}

function freeId(base: string, used: ReadonlySet<string>, attempt = 1): string {
  const candidate = attempt === 1 ? base : `${base}-${attempt}`
  return used.has(candidate) ? freeId(base, used, attempt + 1) : candidate
}

/** Numbers follow the outline: 1, 1.1, 1.2, 2. A jump from h2 to h4 counts as one step deeper. */
function outlineNumbers(items: readonly TocItem[]) {
  const levels = items.map((item) => item.level ?? 0)
  return levels.reduce<{ numbers: readonly string[]; stack: readonly { level: number; count: number }[] }>(
    (state, level) => {
      const kept = state.stack.filter((entry) => entry.level < level)
      const same = state.stack.find((entry) => entry.level === level)
      const stack = [...kept, { level, count: (same?.count ?? 0) + 1 }]
      return { numbers: [...state.numbers, stack.map((entry) => entry.count).join(".")], stack }
    },
    { numbers: [], stack: [] },
  ).numbers
}

/** Indent steps per item, capped at two so a deep outline cannot eat a narrow column. */
function depths(items: readonly TocItem[]) {
  const levels = items.map((item) => item.level ?? 0)
  const top = Math.min(...levels)
  return levels.map((level) => Math.min(2, level - top))
}

function headingStatus(isIntersecting: boolean, top: number, bandTop: number): HeadingStatus {
  if (isIntersecting) return "inside"
  return top < bandTop ? "above" : "below"
}

/**
 * The first heading in the band. With none in it the reader is inside a long section, which belongs to the last
 * heading already passed. That also holds when scrolling back up, which keeping the previous value would get wrong.
 */
function nextActive(ids: readonly string[], statuses: ReadonlyMap<string, HeadingStatus>) {
  const inside = ids.find((id) => statuses.get(id) === "inside")
  if (inside) return inside
  return ids.filter((id) => statuses.get(id) === "above").at(-1) ?? null
}

/** A short last section can never reach the band, so the very end of the scroll has to select it. */
function atScrollEnd(scrollTop: number, clientHeight: number, scrollHeight: number) {
  return scrollHeight > clientHeight && scrollTop + clientHeight >= scrollHeight - 2
}

function scrollTopFor(targetTop: number, rootTop: number, currentScroll: number, offset: number) {
  return currentScroll + targetTop - rootTop - offset
}

function readHeadings(container: HTMLElement, selector: string): readonly TocItem[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector))
  const taken = new Set(elements.map((element) => element.id).filter(Boolean))
  return elements.map((element) => {
    const title = element.textContent?.trim() ?? ""
    if (!element.id) {
      // An anchor needs an id, and headings written by hand or from Markdown often have none.
      element.id = freeId(slugify(title) || "section", taken)
      taken.add(element.id)
    }
    return { id: element.id, title, level: Number(element.tagName.slice(1)) || 0 }
  })
}

function sameItems(a: readonly TocItem[], b: readonly TocItem[]) {
  return a.length === b.length && a.every((item, index) => item.id === b[index].id && item.title === b[index].title && item.level === b[index].level)
}

export { atScrollEnd, depths, headingStatus, nextActive, outlineNumbers, readHeadings, sameItems, scrollTopFor, slugify, type HeadingStatus, type TocItem }
