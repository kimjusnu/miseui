import type * as React from "react"
import { useLayoutEffect, useEffect, useRef, useState } from "react"
import type { CodeLanguage } from "@/registry/miseui/ui/code-block"

interface DocsCode {
  code: string
  language?: CodeLanguage
  /** A file name, or a word such as Terminal. */
  title?: string
}

interface DocsSection {
  /** Becomes the heading id and the address of the jump, so keep it unique across the document. */
  id: string
  title: string
  body: React.ReactNode
  code?: DocsCode
}

interface DocsPage {
  id: string
  title: string
  /** Continues the title in the heading, one tone quieter. */
  lead?: string
  /** A real address, if your router owns the page. Left out, the block swaps the page itself. */
  href?: string
  sections: readonly DocsSection[]
}

interface DocsGroup {
  label: string
  pages: readonly DocsPage[]
}

function flattenPages(groups: readonly DocsGroup[]) {
  return groups.flatMap((group) => group.pages)
}

/** The page to show and its neighbours. An unknown id falls back to the first page, not a blank screen. */
function locatePage(pages: readonly DocsPage[], id: string | undefined) {
  const found = pages.findIndex((page) => page.id === id)
  const index = Math.max(found, 0)
  return { page: pages[index] as DocsPage | undefined, previous: pages[index - 1] as DocsPage | undefined, next: pages[index + 1] as DocsPage | undefined }
}

interface DocsPagesOptions {
  groups: readonly DocsGroup[]
  current?: string
  defaultCurrent?: string
  onNavigate?: (id: string) => void
}

function useDocsPages({ groups, current, defaultCurrent, onNavigate }: DocsPagesOptions) {
  const pages = flattenPages(groups)
  const [uncontrolled, setUncontrolled] = useState(defaultCurrent)
  const located = locatePage(pages, current ?? uncontrolled)
  const select = (id: string) => {
    setUncontrolled(id)
    onNavigate?.(id)
  }
  return { ...located, select }
}

type DocsPages = ReturnType<typeof useDocsPages>

/** A new page starts at its top, and the title takes focus so a screen reader hears where it landed. Not on arrival: that would steal focus from the page. */
function usePageArrival(pageId: string | undefined, scrollRef: React.RefObject<HTMLElement | null> | undefined) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lastRef = useRef(pageId)
  useEffect(() => {
    if (lastRef.current === pageId) return
    lastRef.current = pageId
    scrollRef?.current?.scrollTo({ top: 0 })
    titleRef.current?.focus({ preventScroll: Boolean(scrollRef) })
  }, [pageId, scrollRef])
  return titleRef
}

/** Measured so the sidebar's drawer can follow the block's own width, which a media query cannot see inside a frame. */
function useNarrowerThan(ref: React.RefObject<HTMLElement | null>, width: number) {
  const [narrower, setNarrower] = useState(false)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => setNarrower(entry.contentRect.width < width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, width])
  return narrower
}

export { flattenPages, locatePage, useDocsPages, useNarrowerThan, usePageArrival, type DocsCode, type DocsGroup, type DocsPage, type DocsPages, type DocsPagesOptions, type DocsSection }
